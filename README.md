IMPORTANT POINTS ABOUT PROJECT ARCHITECTURE
Build time transpilation using tsc
Run time transpilation using ts-node-dev
alias set in tsconfig for ts files
alias set using module-alias in package.json for js files
tsconfig-paths used to register alias (defined in tsconfig.json) for runtime execution

module in tsconfig is set to commonJs and not nodenext (that can support top level await) because - tsconfig- paths and module-alias packages use require syntax of commonjs, so if using alias we have to use commonjs
another option is to completely ditch alias and use subpaths (which is recommended for nodenext)
for this project i am sticking with alias using module-alias and tsconfig-paths
since top-level await cannot be used without module:nodenext, in server.ts whole file is wrapped in a immediately invoked async function expression IIFE to force await db connection.
