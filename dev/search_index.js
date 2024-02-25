var documenterSearchIndex = {"docs":
[{"location":"api/#API","page":"API reference","title":"API","text":"","category":"section"},{"location":"api/","page":"API reference","title":"API reference","text":"The main entrypoint for interactive use is print_explicit_imports. ExplicitImports.jl API also includes several other functions to provide programmatic access to the information gathered by the package, as well as utilities to use in regression testing.","category":"page"},{"location":"api/#Detecting-implicit-imports-which-could-be-made-explicit","page":"API reference","title":"Detecting implicit imports which could be made explicit","text":"","category":"section"},{"location":"api/","page":"API reference","title":"API reference","text":"print_explicit_imports\nexplicit_imports","category":"page"},{"location":"api/#ExplicitImports.print_explicit_imports","page":"API reference","title":"ExplicitImports.print_explicit_imports","text":"print_explicit_imports([io::IO=stdout,] mod::Module, file=pathof(mod); skip=(mod, Base, Core), warn_stale=true, strict=true)\n\nRuns explicit_imports and prints the results, along with those of stale_explicit_imports.\n\nKeyword arguments\n\nskip=(mod, Base, Core): any names coming from the listed modules (or any submodules thereof) will be skipped. Since mod is included by default, implicit imports of names exported from its own submodules will not count by default.\nwarn_stale=true: if set, this function will also print information about stale explicit imports.\nstrict=true: when strict is set, a module will be noted as unanalyzable in the case that the analysis could not be performed accurately, due to e.g. dynamic include statements. When strict=false, results are returned in all cases, but may be inaccurate.\n\nSee also check_no_implicit_imports and check_no_stale_explicit_imports.\n\n\n\n\n\n","category":"function"},{"location":"api/#ExplicitImports.explicit_imports","page":"API reference","title":"ExplicitImports.explicit_imports","text":"explicit_imports(mod::Module, file=pathof(mod); skip=(mod, Base, Core), warn_stale=true, strict=true)\n\nReturns a nested structure providing information about explicit import statements one could make for each submodule of mod. This information is structured as a collection of pairs, where the keys are the submodules of mod (including mod itself), and the values are name => exporting_module pairs, showing which names are being used implicitly and which modules they are being used from.\n\nArguments\n\nmod::Module: the module to (recursively) analyze. Often this is a package.\nfile=pathof(mod): this should be a path to the source code that contains the module mod.\nif mod is the top-level module of a package, pathof will be unable to find the code, and a file must be passed which contains mod (either directly or indirectly through includes)\nmod can be a submodule defined within file, but if two modules have the same name (e.g. X.Y.X and X), results may be inaccurate.\n\nKeyword arguments\n\nskip=(mod, Base, Core): any names coming from the listed modules (or any submodules thereof) will be skipped. Since mod is included by default, implicit imports of names exported from its own submodules will not count by default.\nwarn_stale=true: whether or not to warn about stale explicit imports.\nstrict=true: when strict is set, results for a module will be nothing in the case that the analysis could not be performed accurately, due to e.g. dynamic include statements. When strict=false, results are returned in all cases, but may be inaccurate.\n\nSee also print_explicit_imports to easily compute and print these results, explicit_imports_nonrecursive for a non-recursive version which ignores submodules, and  check_no_implicit_imports for a version that throws errors, for regression testing.\n\n\n\n\n\n","category":"function"},{"location":"api/#Looking-just-for-stale-explicit-exports","page":"API reference","title":"Looking just for stale explicit exports","text":"","category":"section"},{"location":"api/","page":"API reference","title":"API reference","text":"While print_explicit_imports prints stale explicit exports, and explicit_imports by default provides a warning when stale explicit exports are present, sometimes one wants to only look for stale explicit exports without looking at implicit imports. Here we provide some entrypoints that help for this use-case.","category":"page"},{"location":"api/","page":"API reference","title":"API reference","text":"print_stale_explicit_imports\nstale_explicit_imports","category":"page"},{"location":"api/#ExplicitImports.print_stale_explicit_imports","page":"API reference","title":"ExplicitImports.print_stale_explicit_imports","text":"print_stale_explicit_imports([io::IO=stdout,] mod::Module, file=pathof(mod); strict=true)\n\nRuns stale_explicit_imports and prints the results.\n\nKeyword arguments\n\nstrict=true: when strict is set, a module will be noted as unanalyzable in the case that the analysis could not be performed accurately, due to e.g. dynamic include statements. When strict=false, results are returned in all cases, but may be inaccurate.\n\nSee also print_explicit_imports and check_no_stale_explicit_imports.\n\n\n\n\n\n","category":"function"},{"location":"api/#ExplicitImports.stale_explicit_imports","page":"API reference","title":"ExplicitImports.stale_explicit_imports","text":"stale_explicit_imports(mod::Module, file=pathof(mod); strict=true)\n\nReturns a collection of pairs, where the keys are submodules of mod (including mod itself), and the values are lists of names that are explicitly imported in that submodule, but which either are not used, or are only used in a qualified fashion, making the explicit import a priori unnecessary.\n\nwarning: Warning\nNote that it is possible for an import from a module (say X) into one module (say A) to be relied on from another unrelated module (say B). For example, if A contains the code using X: x, but either does not use x at all or only uses x in the form X.x, then x will be flagged as a stale explicit import by this function. However, it could be that the code in some unrelated module B uses A.x or using A: x, relying on the fact that x has been imported into A's namespace.This is an unusual situation (generally B should just get x directly from X, rather than indirectly via A), but there are situations in which it arises, so one may need to be careful about naively removing all \"stale\" explicit imports flagged by this function.\n\nKeyword arguments\n\nstrict=true: when strict is set, results for a module will be nothing in the case that the analysis could not be performed accurately, due to e.g. dynamic include statements. When strict=false, results are returned in all cases, but may be inaccurate.\n\nSee stale_explicit_imports_nonrecursive for a non-recursive version, and check_no_stale_explicit_imports for a version that throws an error when encountering stale explicit imports.\n\nSee also print_explicit_imports which prints this information.\n\n\n\n\n\n","category":"function"},{"location":"api/#Usage-in-testing","page":"API reference","title":"Usage in testing","text":"","category":"section"},{"location":"api/","page":"API reference","title":"API reference","text":"ExplicitImports.jl provides two functions which can be used to regression test that there is no reliance on implicit imports or stale explicit imports:","category":"page"},{"location":"api/","page":"API reference","title":"API reference","text":"check_no_implicit_imports\ncheck_no_stale_explicit_imports","category":"page"},{"location":"api/#ExplicitImports.check_no_implicit_imports","page":"API reference","title":"ExplicitImports.check_no_implicit_imports","text":"check_no_implicit_imports(mod::Module, file=pathof(mod); skip=(mod, Base, Core), ignore::Tuple=(), allow_unanalyzable::Tuple=())\n\nChecks that neither mod nor any of its submodules is relying on implicit imports, throwing an ImplicitImportsException if so, and returning nothing otherwise.\n\nThis function can be used in a package's tests, e.g.\n\n@test check_no_implicit_imports(MyPackage) === nothing\n\nAllowing some submodules to be unanalyzable\n\nPass allow_unanalyzable as a tuple of submodules which are allowed to be unanalyzable. Any other submodules found to be unanalyzable will result in an UnanalyzableModuleException being thrown.\n\nThese unanalyzable submodules can alternatively be included in ignore.\n\nAllowing some implicit imports\n\nThe skip keyword argument can be passed to allow implicit imports from some modules (and their submodules). By default, skip is set to (Base, Core). For example:\n\n@test check_no_implicit_imports(MyPackage; skip=(Base, Core, DataFrames)) === nothing\n\nwould verify there are no implicit imports from modules other than Base, Core, and DataFrames.\n\nAdditionally, the keyword ignore can be passed to represent a tuple of items to ignore. These can be:\n\nmodules. Any submodule of mod matching an element of ignore is skipped. This can be used to allow the usage of implicit imports in some submodule of your package.\nsymbols: any implicit import of a name matching an element of ignore is ignored (does not throw)\nsymbol => module pairs. Any implicit import of a name matching that symbol from a module matching the module is ignored.\n\nOne can mix and match between these type of ignored elements. For example:\n\n@test check_no_implicit_imports(MyPackage; ignore=(:DataFrame => DataFrames, :ByRow, MySubModule)) === nothing\n\nThis would:\n\nIgnore any implicit import of DataFrame from DataFrames\nIgnore any implicit import of the name ByRow from any module.\nIgnore any implicit imports present in MyPackage's submodule MySubModule\n\nbut verify there are no other implicit imports.\n\n\n\n\n\n","category":"function"},{"location":"api/#ExplicitImports.check_no_stale_explicit_imports","page":"API reference","title":"ExplicitImports.check_no_stale_explicit_imports","text":"check_no_stale_explicit_imports(mod::Module, file=pathof(mod); ignore::Tuple=(), allow_unanalyzable::Tuple=())\n\nChecks that neither mod nor any of its submodules has stale (unused) explicit imports, throwing an StaleImportsException if so, and returning nothing otherwise.\n\nThis can be used in a package's tests, e.g.\n\n@test check_no_stale_explicit_imports(MyPackage) === nothing\n\nAllowing some submodules to be unanalyzable\n\nPass allow_unanalyzable as a tuple of submodules which are allowed to be unanalyzable. Any other submodules found to be unanalyzable will result in an UnanalyzableModuleException being thrown.\n\nAllowing some stale explicit imports\n\nIf ignore is supplied, it should be a tuple of Symbols, representing names that are allowed to be stale explicit imports. For example,\n\n@test check_no_stale_explicit_imports(MyPackage; ignore=(:DataFrame,)) === nothing\n\nwould check there were no stale explicit imports besides that of the name DataFrame.\n\n\n\n\n\n","category":"function"},{"location":"api/#Non-recursive-variants","page":"API reference","title":"Non-recursive variants","text":"","category":"section"},{"location":"api/","page":"API reference","title":"API reference","text":"The above functions all recurse through submodules of the provided module, providing information about each. Here, we provide non-recursive variants (which in fact power the recursive ones), in case it is useful, perhaps for building other tooling on top of ExplicitImports.jl.","category":"page"},{"location":"api/","page":"API reference","title":"API reference","text":"explicit_imports_nonrecursive\nstale_explicit_imports_nonrecursive","category":"page"},{"location":"api/#ExplicitImports.explicit_imports_nonrecursive","page":"API reference","title":"ExplicitImports.explicit_imports_nonrecursive","text":"explicit_imports_nonrecursive(mod::Module, file=pathof(mod); skip=(mod, Base, Core), warn_stale=true, strict=true)\n\nA non-recursive version of explicit_imports, meaning it only analyzes the module mod itself, not any of its submodules; see that function for details.\n\nKeyword arguments\n\nskip=(mod, Base, Core): any names coming from the listed modules (or any submodules thereof) will be skipped. Since mod is included by default, implicit imports of names exported from its own submodules will not count by default.\nwarn_stale=true: whether or not to warn about stale explicit imports.\nstrict=true: when strict=true, results will be nothing in the case that the analysis could not be performed accurately, due to e.g. dynamic include statements. When strict=false, results are returned in all cases, but may be inaccurate.\n\n\n\n\n\n","category":"function"},{"location":"api/#ExplicitImports.stale_explicit_imports_nonrecursive","page":"API reference","title":"ExplicitImports.stale_explicit_imports_nonrecursive","text":"stale_explicit_imports_nonrecursive(mod::Module, file=pathof(mod); strict=true) -> Union{Nothing, Vector{Symbol}}\n\nA non-recursive version of stale_explicit_imports, meaning it only analyzes the module mod itself, not any of its submodules.\n\nReturns a list of names that are not used in mod, but are still explicitly imported.\n\nKeyword arguments\n\nstrict=true: when strict=true, results will be nothing in the case that the analysis could not be performed accurately, due to e.g. dynamic include statements. When strict=false, results are returned in all cases, but may be inaccurate.\n\nSee also print_explicit_imports and check_no_stale_explicit_imports, both of which do recurse through submodules.\n\n\n\n\n\n","category":"function"},{"location":"","page":"Home","title":"Home","text":"CurrentModule = ExplicitImports","category":"page"},{"location":"","page":"Home","title":"Home","text":"using ExplicitImports, Markdown\ncontents = read(joinpath(pkgdir(ExplicitImports), \"README.md\"), String)\ncontents = replace(contents, \"[![Dev](https://img.shields.io/badge/docs-dev-blue.svg)](https://ericphanson.github.io/ExplicitImports.jl/dev/)\" => \"\")\nMarkdown.parse(contents)","category":"page"},{"location":"#Documentation-Index","page":"Home","title":"Documentation Index","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"","category":"page"},{"location":"internals/#Implementation-strategy","page":"Dev docs","title":"Implementation strategy","text":"","category":"section"},{"location":"internals/","page":"Dev docs","title":"Dev docs","text":"[DONE hackily] Figure out what names used in the module are being used to refer to bindings in global scope (as opposed to e.g. shadowing globals).\nWe do this by parsing the code (thanks to JuliaSyntax), then reimplementing scoping rules on top of the parse tree\nThis is finicky, but assuming scoping doesn't change, should be robust enough (once the long tail of edge cases are dealt with...)\nCurrently, I don't handle the global keyword, so those may look like local variables and confuse things\nThis means we need access to the raw source code; pathof works well for packages, but for local modules one has to pass the path themselves. Also doesn't seem to work well for stdlibs in the sysimage\n[DONE] Figure out what implicit imports are available in the module, and which module they come from\ndone, via a magic ccall from Discourse, and Base.which.\n[DONE] Figure out which names have been explicitly imported already\nDone via parsing","category":"page"},{"location":"internals/","page":"Dev docs","title":"Dev docs","text":"Then we can put this information together to figure out what names are actually being used from other modules, and whose usage could be made explicit, and also which existing explicit imports are not being used.","category":"page"},{"location":"internals/#Internals","page":"Dev docs","title":"Internals","text":"","category":"section"},{"location":"internals/","page":"Dev docs","title":"Dev docs","text":"ExplicitImports.find_implicit_imports\nExplicitImports.get_names_used\nExplicitImports.analyze_all_names\nExplicitImports.inspect_session","category":"page"},{"location":"internals/#ExplicitImports.find_implicit_imports","page":"Dev docs","title":"ExplicitImports.find_implicit_imports","text":"find_implicit_imports(mod::Module; skip=(mod, Base, Core))\n\nGiven a module mod, returns a Dict{Symbol, Module} showing names exist in mod's namespace which are available due to implicit exports by other modules. The dict's keys are those names, and the values are the module that the name comes from.\n\nIn the case of ambiguities (two modules exporting the same name), the name is unavailable in the module, and hence the name will not be present in the dict.\n\nThis is powered by Base.which.\n\n\n\n\n\n","category":"function"},{"location":"internals/#ExplicitImports.get_names_used","page":"Dev docs","title":"ExplicitImports.get_names_used","text":"get_names_used(file) -> FileAnalysis\n\nFigures out which global names are used in file, and what modules they are used within.\n\nTraverses static include statements.\n\nReturns two Set{@NamedTuple{name::Symbol,module_path::Vector{Symbol}}}, namely\n\nneeds_explicit_import\nunnecessary_explicit_import\n\nand a Set{Vector{Symbol}} of \"untainted module paths\", i.e. those which were analyzed and do not contain an unanalyzable include:\n\nuntainted_modules\n\n\n\n\n\n","category":"function"},{"location":"internals/#ExplicitImports.analyze_all_names","page":"Dev docs","title":"ExplicitImports.analyze_all_names","text":"analyze_all_names(file)\n\nReturns a tuple of three items:\n\na table with one row per name per scope, with information about whether or not it is within global scope, what modules it is in, and whether or not it was assigned before ever being used in that scope.\na table with one row per name per module path, consisting of names that have been explicitly imported in that module.\na set of \"untainted\" module paths, which were analyzed and no includes were skipped\n\n\n\n\n\n","category":"function"},{"location":"internals/#ExplicitImports.inspect_session","page":"Dev docs","title":"ExplicitImports.inspect_session","text":"ExplicitImports.inspect_session([io::IO=stdout,]; skip=(Base, Core), inner=print_explicit_imports)\n\nExperimental functionality to call inner (defaulting to print_explicit_imports) on each loaded package in the Julia session.\n\n\n\n\n\n","category":"function"}]
}
