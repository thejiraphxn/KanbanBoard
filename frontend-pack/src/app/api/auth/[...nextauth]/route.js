import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
    providers: [
        CredentialsProvider({
        name: "Credentials",
        credentials: {
            mb_username: { label: "Username", type: "text" },
            mb_password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            const res = await fetch(`${process.env.API_URL}/api/auth/signin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials)
            })

            const data = await res.json()

            if (res.ok && data.token && data?.user) {
                return {
                    ...data.user,
                    token: data.token
                }
            }

            throw new Error(data.message || "Login failed")
        }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 1
    },
    jwt: {
        maxAge: 60 * 60 * 24 * 1,
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login"
    },
    callbacks: {
        async jwt({ token, user }) {
        if (user) {
            token.accessToken = user.token
            token.mb_id = user.mb_id
            token.mb_username = user.mb_username
            token.mb_email = user.mb_email
            token.mb_firstname = user.mb_firstname
            token.mb_lastname = user.mb_lastname
        }
        return token
        },
        async session({ session, token }) {
        session.user = {
            mb_id: token.mb_id,
            mb_username: token.mb_username,
            mb_email: token.mb_email,
            mb_firstname: token.mb_firstname,
            mb_lastname: token.mb_lastname,
            token: token.accessToken
        }
        return session
        }
    }
})

export { handler as GET, handler as POST } 