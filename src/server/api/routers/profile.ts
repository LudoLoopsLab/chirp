import { clerkClient } from "@clerk/nextjs"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, publicProcedure } from "../trpc"
import { filterUSerForClient } from "~/server/helpers/filterUserForClient"



// create a new rate limiter, that allows 3 request per 1 minutes


export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const [user] = await clerkClient.users.getUserList({
        username: [input.username],
      })

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not Found",
        })
      }
      return filterUSerForClient(user)
    })
})
