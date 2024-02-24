var documenterSearchIndex = {"docs":
[{"location":"api/#API","page":"API reference","title":"API","text":"","category":"section"},{"location":"api/","page":"API reference","title":"API reference","text":"The main entrypoint for interactive use is print_explicit_imports. ExplicitImports.jl API also includes several other functions to provide programmatic access to the information gathered by the package, as well as utilities to use in regression testing.","category":"page"},{"location":"api/","page":"API reference","title":"API reference","text":"print_explicit_imports\nexplicit_imports\nstale_explicit_imports\nexplicit_imports_single","category":"page"},{"location":"api/#ExplicitImports.print_explicit_imports","page":"API reference","title":"ExplicitImports.print_explicit_imports","text":"print_explicit_imports([io::IO=stdout,] mod, file=pathof(mod); kw...)\n\nRuns explicit_imports and prints the results, along with those of stale_explicit_imports. Accepts the same keyword arguments as that function.\n\n\n\n\n\n","category":"function"},{"location":"api/#ExplicitImports.explicit_imports","page":"API reference","title":"ExplicitImports.explicit_imports","text":"explicit_imports(mod, file=pathof(mod); skips=(Base, Core), warn=true)\n\nReturns a nested structure providing information about explicit import statements one could make for each submodule of mod.\n\nfile=pathof(mod): this should be a path to the source code that contains the module mod.\nif mod is not from a package, pathof will be unable to find the code, and a file must be passed which contains mod (either directly or indirectly through includes)\nmod can be a submodule defined within file, but if two modules have the same name (e.g. X.Y.X and X), results may be inaccurate.\nskips=(Base, Core): any names coming from the listed modules (or any submodules thereof) will be skipped.\nwarn=true: whether or not to warn about stale explicit imports.\n\nSee also print_explicit_imports to easily compute and print these results, and explicit_imports_single for a non-recursive version which ignores submodules.\n\n\n\n\n\n","category":"function"},{"location":"api/#ExplicitImports.stale_explicit_imports","page":"API reference","title":"ExplicitImports.stale_explicit_imports","text":"stale_explicit_imports(mod, file=pathof(mod)) -> Vector{Symbol}\n\nReturns a list of names that are not used in mod, but are still explicitly imported.\n\n\n\n\n\n","category":"function"},{"location":"api/#ExplicitImports.explicit_imports_single","page":"API reference","title":"ExplicitImports.explicit_imports_single","text":"explicit_imports_single(mod, file=pathof(mod); skips=(Base, Core), warn=true)\n\nA non-recursive version of explicit_imports; see that function for details.\n\n\n\n\n\n","category":"function"},{"location":"api/#Usage-in-testing","page":"API reference","title":"Usage in testing","text":"","category":"section"},{"location":"api/","page":"API reference","title":"API reference","text":"ExplicitImports.jl provides two functions which can be used to regression test that there is no reliance on implicit imports or stale explicit imports:","category":"page"},{"location":"api/","page":"API reference","title":"API reference","text":"check_no_implicit_imports\ncheck_no_stale_explicit_imports","category":"page"},{"location":"api/#ExplicitImports.check_no_implicit_imports","page":"API reference","title":"ExplicitImports.check_no_implicit_imports","text":"check_no_implicit_imports(mod, file=pathof(mod); skips=(Base, Core), warn=false)\n\nChecks that neither mod nor any of its submodules is relying on implicit imports, throwing an ImplicitImportsException if so, and returning nothing otherwise.\n\nThis can be used in a package's tests, e.g.\n\n@test check_no_implicit_imports(MyPackage) === nothing\n\n\n\n\n\n","category":"function"},{"location":"api/#ExplicitImports.check_no_stale_explicit_imports","page":"API reference","title":"ExplicitImports.check_no_stale_explicit_imports","text":"check_no_stale_explicit_imports(mod, file=pathof(mod))\n\nChecks that neither mod nor any of its submodules has stale (unused) explicit imports, throwing an StaleImportsException if so, and returning nothing otherwise.\n\nThis can be used in a package's tests, e.g.\n\n@test check_no_stale_explicit_imports(MyPackage) === nothing\n\n\n\n\n\n","category":"function"},{"location":"","page":"Home","title":"Home","text":"CurrentModule = ExplicitImports","category":"page"},{"location":"","page":"Home","title":"Home","text":"using ExplicitImports, Markdown\ncontents = read(joinpath(pkgdir(ExplicitImports), \"README.md\"), String)\ncontents = replace(contents, \"[![Dev](https://img.shields.io/badge/docs-dev-blue.svg)](https://ericphanson.github.io/ExplicitImports.jl/dev/)\" => \"\")\nMarkdown.parse(contents)","category":"page"},{"location":"#Documentation-Index","page":"Home","title":"Documentation Index","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"","category":"page"},{"location":"internals/#Implementation-strategy","page":"Dev docs","title":"Implementation strategy","text":"","category":"section"},{"location":"internals/","page":"Dev docs","title":"Dev docs","text":"[DONE hackily] Figure out what names used in the module are being used to refer to bindings in global scope (as opposed to e.g. shadowing globals).\nWe do this by parsing the code (thanks to JuliaSyntax), then reimplementing scoping rules on top of the parse tree\nThis is finicky, but assuming scoping doesn't change, should be robust enough (once the long tail of edge cases are dealt with...)\nCurrently, I don't handle the global keyword, so those may look like local variables and confuse things\nThis means we need access to the raw source code; pathof works well for packages, but for local modules one has to pass the path themselves. Also doesn't seem to work well for stdlibs in the sysimage\n[DONE] Figure out what implicit imports are available in the module, and which module they come from\ndone, via a magic ccall from Discourse, and Base.which.\n[DONE] Figure out which names have been explicitly imported already\nDone via parsing","category":"page"},{"location":"internals/","page":"Dev docs","title":"Dev docs","text":"Then we can put this information together to figure out what names are actually being used from other modules, and whose usage could be made explicit, and also which existing explicit imports are not being used.","category":"page"},{"location":"internals/#Internals","page":"Dev docs","title":"Internals","text":"","category":"section"},{"location":"internals/","page":"Dev docs","title":"Dev docs","text":"ExplicitImports.find_implicit_imports\nExplicitImports.get_names_used\nExplicitImports.analyze_all_names","category":"page"},{"location":"internals/#ExplicitImports.find_implicit_imports","page":"Dev docs","title":"ExplicitImports.find_implicit_imports","text":"find_implicit_imports(mod::Module; skips=(Base, Core))\n\nGiven a module mod, returns a Dict{Symbol, Module} showing names exist in mod's namespace which are available due to implicit exports by other modules. The dict's keys are those names, and the values are the module that the name comes from.\n\nIn the case of ambiguities (two modules exporting the same name), the name is unavailable in the module, and hence the name will not be present in the dict.\n\nThis is powered by Base.which.\n\n\n\n\n\n","category":"function"},{"location":"internals/#ExplicitImports.get_names_used","page":"Dev docs","title":"ExplicitImports.get_names_used","text":"get_names_used(file) -> DataFrame\n\nFigures out which global names are used in file, and what modules they are used within.\n\nTraverses static include statements.\n\nReturns a DataFrame with four columns:\n\nname: the name in question\nmodule_path: the path of modules to access the name, where the first module in the path is the innermost.\nneeds_explicit_import::Bool\nunnecessary_explicit_import::Bool\n\n\n\n\n\n","category":"function"},{"location":"internals/#ExplicitImports.analyze_all_names","page":"Dev docs","title":"ExplicitImports.analyze_all_names","text":"analyze_all_names(file) -> Tuple{DataFrame, DataFrame}\n\nReturns:\n\na DataFrame with one row per name per scope, with information about whether or not it is within global scope, what modules it is in, and whether or not it was assigned before ever being used in that scope.\na DataFrame with one row per name per module path, consisting of names that have been explicitly imported in that module.\n\n\n\n\n\n","category":"function"}]
}
