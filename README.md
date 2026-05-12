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

Error handling - s middleware function after handling routes- any unhandled error is automatically forwarded to the next middleware function in the stack
My Middleware function calls handleError
No try catch at controller or service level, so errors are not caught and are directed to the middleware function by Express
Custom classes for each error - Bad Request, Forbidden etc are created which extends to ApiError class which extends to Error class.
At service layer, throw custom class errors wherever applicable, ex BadRequestError
When handleError receives an error it checks if it is an instance of ApiError
If instance of ApiError the error message is forwarded from custom class, otherwise An unexpected error has occurred message is forwarded and response is sent using handleResponse
