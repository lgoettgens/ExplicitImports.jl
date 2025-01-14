# In this file, we try to answer the question: what global bindings are being used in a particular module?
# We will do this by parsing, then re-implementing scoping rules on top of the parse tree.

# Here we define a wrapper so we can use AbstractTrees without piracy
# https://github.com/JuliaEcosystem/PackageAnalyzer.jl/blob/293a0836843f8ce476d023e1ca79b7e7354e884f/src/count_loc.jl#L91-L99
struct SyntaxNodeWrapper
    node::JuliaSyntax.SyntaxNode
    file::String
    bad_locations::Set{String}
end

Base.@kwdef struct FileAnalysis
    needs_explicit_import::Set{@NamedTuple{name::Symbol,module_path::Vector{Symbol}}}
    unnecessary_explicit_import::Set{@NamedTuple{name::Symbol,module_path::Vector{Symbol}}}
    untainted_modules::Set{Vector{Symbol}}
end

function SyntaxNodeWrapper(file::AbstractString; bad_locations=Set{String}())
    contents = read(file, String)
    parsed = JuliaSyntax.parseall(JuliaSyntax.SyntaxNode, contents; ignore_warnings=true)
    return SyntaxNodeWrapper(parsed, file, bad_locations)
end

function try_parse_wrapper(file::AbstractString; bad_locations)
    return try
        SyntaxNodeWrapper(file; bad_locations)
    catch e
        msg = "Error when parsing file. Skipping this file."
        @error msg file exception = (e, catch_backtrace())
        nothing
    end
end

function location_str(wrapper::SyntaxNodeWrapper)
    line, col = JuliaSyntax.source_location(wrapper.node)
    return "$(wrapper.file):$line:$col"
end

struct SkippedFile
    # location of the file being skipped
    # (we don't include the file itself, since we may not know what it is)
    location::Union{String}
end

AbstractTrees.children(::SkippedFile) = ()

# Here we define children such that if we get to a static `include`, we just recurse
# into the parse tree of that file.
# This function has become increasingly horrible in the name of robustness
function AbstractTrees.children(wrapper::SyntaxNodeWrapper)
    node = wrapper.node
    if JuliaSyntax.kind(node) == K"call"
        children = JuliaSyntax.children(node)
        if length(children) == 2
            f, arg = children::Vector{JuliaSyntax.SyntaxNode} # make JET happy
            if f.val === :include
                location = location_str(wrapper)
                if location in wrapper.bad_locations
                    return [SkippedFile(location)]
                end
                if JuliaSyntax.kind(arg) == K"string"
                    children = JuliaSyntax.children(arg)
                    # string literals can only have one child (I think...)
                    c = only(children)
                    # The children of a static include statement is the entire file being included
                    new_file = joinpath(dirname(wrapper.file), c.val)
                    if isfile(new_file)
                        @debug "Recursing into `$new_file`" node wrapper.file
                        new_wrapper = try_parse_wrapper(new_file; wrapper.bad_locations)
                        if new_wrapper !== nothing
                            return [new_wrapper]
                        else
                            push!(wrapper.bad_locations, location)
                            return [SkippedFile(location)]
                        end
                    else
                        @warn "`include` at $location points to missing file; cannot recurse into it."
                        push!(wrapper.bad_locations, location)
                        return [SkippedFile(location)]
                    end
                else
                    @warn "Dynamic `include` found at $location; not recursing"
                    push!(wrapper.bad_locations, location)
                    return [SkippedFile(location)]
                end
            end
        end
    end
    return map(n -> SyntaxNodeWrapper(n, wrapper.file, wrapper.bad_locations),
               JuliaSyntax.children(node))
end

function is_qualified(leaf)
    # is this name being used in a qualified context, like `X.y`?
    if !isnothing(parent(leaf)) && !isnothing(parent(parent(leaf)))
        p = nodevalue(parent(leaf)).node
        p2 = nodevalue(parent(parent(leaf))).node
        if JuliaSyntax.kind(p) == K"quote" && JuliaSyntax.kind(p2) == K"."
            # ok but is the quote we are in the 2nd argument, not the first?
            dot_kids = JuliaSyntax.children(p2)
            if length(dot_kids) == 2 && dot_kids[2] == p
                return true
            end
        end
    end
    return false
end

# figure out if `leaf` is part of an import or using statement
# this seems to trigger for both `X` and `y` in `using X: y`, but that seems alright.
function analyze_import_type(leaf)
    isnothing(parent(leaf)) && return false
    p = nodevalue(parent(leaf)).node
    is_import = JuliaSyntax.kind(p) == K"importpath"
    if is_import && !isnothing(parent(parent(leaf)))
        p2 = nodevalue(parent(parent(leaf))).node
        if JuliaSyntax.kind(p2) == K":"
            kids = JuliaSyntax.children(p2)
            if !isempty(kids)
                if first(kids) != p
                    # We aren't the first child, therefore we are on the RHS
                    return :import_RHS
                else
                    return :import_LHS
                end
            end
        end
    end
    # Not part of `:` generally means it's a `using X` or `import Y` situation
    is_import && return :blanket_import
    return :not_import
end

# Here we use the magic of AbstractTrees' `TreeCursor` so we can start at
# a leaf and follow the parents up to see what scopes our leaf is in.
function analyze_name(leaf; debug=false)
    # Ok, we have a "name". Let us work our way up and try to figure out if it is in local scope or not
    global_scope = true
    module_path = Symbol[]
    scope_path = []
    is_assignment = false
    node = leaf
    idx = 1

    while true
        # update our state
        val = nodevalue(node).node.val
        head = nodevalue(node).node.raw.head
        kind = JuliaSyntax.kind(head)
        args = nodevalue(node).node.raw.args

        debug && println(val, ": ", kind)
        if kind in (K"let", K"for", K"function")
            global_scope = false
            push!(scope_path, nodevalue(node).node)
            # try to detect presence in RHS of inline function definition
        elseif idx > 3 && kind == K"=" && !isempty(args) &&
               JuliaSyntax.kind(first(args)) == K"call"
            global_scope = false
            push!(scope_path, nodevalue(node).node)
        end

        # track which modules we are in
        if kind == K"module"
            ids = filter(children(nodevalue(node))) do arg
                return JuliaSyntax.kind(arg.node) == K"Identifier"
            end
            if !isempty(ids)
                push!(module_path, first(ids).node.val)
            end
            push!(scope_path, nodevalue(node).node)
        end

        # figure out if our name (`nodevalue(leaf)`) is the LHS of an assignment
        # Note: this doesn't detect assignments to qualified variables (`X.y = rhs`)
        # but that's OK since we don't want to pick them up anyway.
        if kind == K"="
            kids = children(nodevalue(node))
            if !isempty(kids)
                c = first(kids)
                is_assignment = c == nodevalue(leaf)
            end
        end

        node = parent(node)

        # finished climbing to the root
        node === nothing &&
            return (; global_scope, is_assignment, module_path, scope_path)
        idx += 1
    end
end

"""
    analyze_all_names(file)

Returns a tuple of three items:

* a table with one row per name per scope, with information about whether or not it is within global scope, what modules it is in, and whether or not it was assigned before ever being used in that scope.
* a table with one row per name per module path, consisting of names that have been explicitly imported in that module.
* a set of "untainted" module paths, which were analyzed and no `include`s were skipped
"""
function analyze_all_names(file; debug=false)
    # we don't use `try_parse_wrapper` here, since there's no recovery possible
    # (no other files we know about to look at)
    tree = SyntaxNodeWrapper(file)
    # in local scope, a name refers to a global if it is read from before it is assigned to, OR if the global keyword is used
    # a name refers to a local otherwise
    # so we need to traverse the tree, keeping track of state like: which scope are we in, and for each name, in each scope, has it been used

    # Here we use a `TreeCursor`; this lets us iterate over the tree, while ensuring
    # we can call `parent` to climb up from a leaf.
    cursor = TreeCursor(tree)
    per_scope_info = @NamedTuple{name::Symbol,global_scope::Bool,assigned_first::Bool,
                                 module_path::Vector{Symbol},
                                 scope_path::Vector{JuliaSyntax.SyntaxNode}}[]

    # We actually only care about the first instance of a name in any given scope,
    # since that tells us about assignment
    seen = Set{@NamedTuple{name::Symbol,scope_path::Vector{JuliaSyntax.SyntaxNode}}}()

    explicit_imports = Set{@NamedTuple{name::Symbol,module_path::Vector{Symbol}}}()

    # we need to keep track of all names that we see, because we could
    # miss entire modules if it is an `include` we cannot follow.
    # Therefore, the "untainted" modules will be all the seen ones
    # minus all the explicitly tainted ones, and those will be the ones
    # safe to analyze.
    seen_modules = Set{Vector{Symbol}}()

    tainted_modules = Set{Vector{Symbol}}()

    for leaf in Leaves(cursor)
        item = nodevalue(leaf)
        if item isa SkippedFile
            # we start from the parent
            mod_path = analyze_name(parent(leaf); debug).module_path
            push!(tainted_modules, mod_path)
            continue
        end

        # if we don't find any identifiers in a module, I think it's OK to mark it as
        # "not-seen"? Otherwise we need to analyze every leaf, not just the identifiers
        # and that sounds slow. Seems like a very rare edge case to have no identifiers...
        JuliaSyntax.kind(item.node) == K"Identifier" || continue

        # Ok, we have a "name". We want to know if:
        # 1. it is being used in global scope
        # or 2. it is being used in local scope, but refers to a global binding
        # To figure out the latter, we check if it has been assigned before it has been used.
        #
        # We want to figure this out on a per-module basis, since each module has a different global namespace.

        debug && println("-"^80)
        debug && println("Leaf position: $(location_str(nodevalue(leaf)))")
        name = nodevalue(leaf).node.val
        debug && println("Leaf name: ", name)
        qualified = is_qualified(leaf)

        if qualified
            debug && println("$name's usage here is qualified; skipping")
            # We will still do the analysis to mark the module as seen
            mod_path = analyze_name(leaf; debug).module_path
            push!(seen_modules, mod_path)
            continue
        end
        import_type = analyze_import_type(leaf)
        debug && println("Import type: ", import_type)
        debug && println("--")
        debug && println("val : kind")
        ret = analyze_name(leaf; debug)
        debug && println(ret)

        push!(seen_modules, ret.module_path)

        if import_type == :import_RHS
            push!(explicit_imports, (; name, ret.module_path))
        elseif import_type == :not_import
            # Only add it the first time
            if (; name, ret.scope_path) ∉ seen
                push!(per_scope_info,
                      (; name, ret.global_scope, assigned_first=ret.is_assignment,
                       ret.module_path, ret.scope_path))
                push!(seen, (; name, ret.scope_path))
            end
        end
    end
    untainted_modules = setdiff!(seen_modules, tainted_modules)
    return per_scope_info, explicit_imports, untainted_modules
end

"""
    get_names_used(file) -> FileAnalysis

Figures out which global names are used in `file`, and what modules they are used within.

Traverses static `include` statements.

Returns two `Set{@NamedTuple{name::Symbol,module_path::Vector{Symbol}}}`, namely

* `needs_explicit_import`
* `unnecessary_explicit_import`

and a `Set{Vector{Symbol}}` of "untainted module paths", i.e. those which were analyzed and do not contain an unanalyzable `include`:

* `untainted_modules`
"""
function get_names_used(file)
    check_file(file)
    # Here we get 1 row per name per scope
    per_scope_info, explicit_imports, untainted_modules = analyze_all_names(file)

    # if a name is used to refer to a global in any scope within a module,
    # then we may want to explicitly import it.
    # So we iterate through our scopes and see.
    names_used_for_global_bindings = Set{@NamedTuple{name::Symbol,
                                                     module_path::Vector{Symbol}}}()
    for nt in per_scope_info
        if nt.global_scope || !nt.assigned_first
            push!(names_used_for_global_bindings, (; nt.name, nt.module_path))
        end
    end
    # name used to point to a global which was not explicitly imported
    needs_explicit_import = setdiff(names_used_for_global_bindings, explicit_imports)
    unnecessary_explicit_import = setdiff(explicit_imports, names_used_for_global_bindings)

    return FileAnalysis(; needs_explicit_import, unnecessary_explicit_import,
                        untainted_modules)
end
