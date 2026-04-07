import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

const formatClerkUser = (data) => {
    const email = data?.email_addresses?.[0]?.email_address || data?.email || data?.primary_email_address || `${data?.id || 'unknown'}@clerk.local`;
    const name = data?.full_name || [data?.first_name, data?.last_name].filter(Boolean).join(" ") || email || data?.id || "Unknown User";
    const image = data?.profile_image_url || data?.image_url || "";

    return {
        id: data?.id,
        email,
        name,
        image
    };
};

// Initialize with explicit app name
export const inngest = new Inngest({
    id: "my-app",
    name: "Rivet App",
    eventKey: process.env.INNGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY
});

// Add explicit logging at function creation time
-console.log("📝 Registering function: sync-user-from-clerk with trigger: clerk/user.created");

const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk',
        name: 'Sync User from Clerk',
        triggers: [{ event: 'clerk/user.created' }]
    },
    async ({ event }) => {
        console.log("🎯 FUNCTION TRIGGERED! User created:", event.data?.id);
        const user = formatClerkUser(event.data || {});

        try {
            const createdUser = await prisma.user.upsert({
                where: { id: user.id },
                update: {
                    name: user.name,
                    email: user.email,
                    image: user.image
                },
                create: user
            });
            console.log("✅ User synced to Neon:", createdUser.id);
            return { success: true, userId: createdUser.id };
        } catch (error) {
            console.error("❌ Failed to sync user to Neon:", error);
            throw error;
        }
    }
);

console.log("📝 Registering function: delete-user-with-clerk");

const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-with-clerk',
        name: 'Delete User from Clerk',
        triggers: [{ event: 'clerk/user.deleted' }]
    },
    async ({ event }) => {
        console.log("🎯 FUNCTION TRIGGERED! User deleted:", event.data?.id);

        try {
            await prisma.user.delete({ where: { id: event.data?.id } });
            console.log("✅ User deleted from Neon:", event.data?.id);
            return { success: true };
        } catch (error) {
            console.warn("⚠️ User delete failed or user not found:", event.data?.id, error?.message || error);
            return { success: false, error: error?.message || "delete failed" };
        }
    }
);

console.log("📝 Registering function: update-user-with-clerk");

const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-with-clerk',
        name: 'Update User from Clerk',
        triggers: [{ event: 'clerk/user.updated' }]
    },
    async ({ event }) => {
        console.log("🎯 FUNCTION TRIGGERED! User updated:", event.data?.id);
        const user = formatClerkUser(event.data || {});

        try {
            const updatedUser = await prisma.user.upsert({
                where: { id: user.id },
                update: {
                    name: user.name,
                    email: user.email,
                    image: user.image
                },
                create: user
            });
            console.log("✅ User updated in Neon:", updatedUser.id);
            return { success: true, userId: updatedUser.id };
        } catch (error) {
            console.error("❌ Failed to update user in Neon:", error);
            throw error;
        }
    }
);

console.log("📝 Registering function: session-removed");

const sessionRemoved = inngest.createFunction(
    {
        id: 'session-removed',
        name: 'Session Removed (Logout)',
        triggers: [{ event: 'clerk/session.removed' }]
    },
    async ({ event }) => {
        console.log("🚪 SESSION REMOVED (LOGOUT):", event.data.id);
        return { success: true };
    }
);

console.log("📝 Registering function: session-created");

const sessionCreated = inngest.createFunction(
    {
        id: 'session-created',
        name: 'Session Created (Login)',
        triggers: [{ event: 'clerk/session.created' }]
    },
    async ({ event }) => {
        console.log("✅ SESSION CREATED (LOGIN):", event.data.id);
        return { success: true };
    }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, sessionRemoved, sessionCreated];

console.log(`✅ Total ${functions.length} functions registered successfully`);