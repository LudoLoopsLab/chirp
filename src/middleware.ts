
import { NextResponse } from "next/server"

import { withClerkMiddleware } from "@clerk/nextjs"

export default withClerkMiddleware(() => {
  return NextResponse.next()
})


// Stop Middleware running on static files
export const config = {
  matcher: "/((?!_next/image|_next/static|favicon.ico).*)"
}