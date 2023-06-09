import { clerkClient } from "@clerk/nextjs"
import { type User } from "@clerk/nextjs/dist/types/server"
import { TRPCError } from "@trpc/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis/nodejs"
import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"

const filterUSerForClient = (user: User) => {
  return { id: user.id, username: user.username, profilePicture: user.profileImageUrl }
}


// create a new reate limiter, that allows 3 request per 1 minutes

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true
})
export const postRouter = createTRPCRouter({

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }]

    })

    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })).map(filterUSerForClient)

    return posts.map((post) => {

      const author = users.find((user) => user.id === post.authorId)

      if (!author || !author.username) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Author for post not found" })

      return {
        post,
        author: { ...author, username: author.username }
      }
    })
  }),
  create: publicProcedure.input(
    z.object({
      content: z.string().emoji().min(1).max(280)
    })
  )
    .mutation(async ({ ctx, input }) => {

      const authorId: string = ctx.userId ?? 'n/a'

      const { success } = await ratelimit.limit(authorId)
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" })

      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content
        }
      })

      return post
    }),
})
