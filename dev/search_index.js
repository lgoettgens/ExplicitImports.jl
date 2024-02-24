var documenterSearchIndex = {"docs":
[{"location":"","page":"Home","title":"Home","text":"CurrentModule = ExplicitImports","category":"page"},{"location":"#ExplicitImports","page":"Home","title":"ExplicitImports","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Documentation for ExplicitImports.","category":"page"},{"location":"","page":"Home","title":"Home","text":"","category":"page"},{"location":"","page":"Home","title":"Home","text":"Modules = [ExplicitImports]","category":"page"},{"location":"#ExplicitImports.analyze_all_names-Tuple{Any}","page":"Home","title":"ExplicitImports.analyze_all_names","text":"analyze_all_names(file) -> DataFrame\n\nReturns a DataFrame with one row per name per scope, with information about whether or not it is within global scope, what modules it is in, and whether or not it was assigned before ever being used in that scope.\n\n\n\n\n\n","category":"method"},{"location":"#ExplicitImports.explicit_imports","page":"Home","title":"ExplicitImports.explicit_imports","text":"explicit_imports(mod, file=pathof(mod); skips=(Base, Core)) -> Vector{String}\n\nReturns a list of explicit import statements one could make for the module mod.\n\nCurrently, this does not filter to only new explicit imports (these may be redundant with already existing explicit imports).\n\n\n\n\n\n","category":"function"},{"location":"#ExplicitImports.find_implicit_imports-Tuple{Module}","page":"Home","title":"ExplicitImports.find_implicit_imports","text":"find_implicit_imports(mod::Module; skips=(Base, Core))\n\nGiven a module mod, returns a Dict{Symbol, Module} showing names exist in mod's namespace which are available due to implicit exports by other modules. The dict's keys are those names, and the values are the module that the name comes from.\n\nIn the case of ambiguities (two modules exporting the same name), the name is unavailable in the module, and hence the name will not be present in the dict.\n\nThis is powered by Base.which.\n\n\n\n\n\n","category":"method"},{"location":"#ExplicitImports.get_names_used-Tuple{Any}","page":"Home","title":"ExplicitImports.get_names_used","text":"get_names_used(file) -> DataFrame\n\nFigures out which global names are used in file, and what modules they are used within.\n\nTraverses static include statements.\n\nReturns a DataFrame with two columns, one for the name, and one for the path of modules, where the first module in the path is the innermost.\n\n\n\n\n\n","category":"method"}]
}
