import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

const getClerkUserId = (data) => {
    return data?.id || data?.user_id || data?.user?.id || data?.session?.user_id || data?.session?.user?.id || data?.session?.id;
};

const formatClerkUser = (data) => {
    const raw = data?.user || data?.session || data?.actor || data;
    const id = getClerkUserId(data) || raw?.id || raw?.user_id || raw?.user?.id;
    const email = raw?.email_addresses?.[0]?.email_address || raw?.email || raw?.primary_email_address || raw?.email_address || `${id || 'unknown'}@clerk.local`;
    const name = raw?.full_name || raw?.name || [raw?.first_name, raw?.last_name].filter(Boolean).join(" ") || email || id || "Unknown User";
    const image = raw?.profile_image_url || raw?.image_url || raw?.image || "";

    return {
        id,
        email,
        name,
        image
    };
};

const logClerkEvent = (event, tag) => {
    const id = getClerkUserId(event.data);
    const payload = {
        id,
        user_id: event.data?.user_id,
        session_user_id: event.data?.session?.user_id,
        eventDataKeys: Object.keys(event.data || {})
    };
    console.log(`📥 ${tag} event=${event.name}`, payload);
};

const upsertClerkUser = async (data) => {
    const user = formatClerkUser(data || {});

    if (!user.id) {
        console.warn("⚠️ Clerk user payload missing id, skipping Neon upsert", data);
        return null;
    }

    return prisma.user.upsert({
        where: { id: user.id },
        update: {
            name: user.name,
            email: user.email,
            image: user.image
        },
        create: user
    });
};

// Initialize with explicit app name
export const inngest = new Inngest({
    id: "my-app",
    name: "Rivet App",
    eventKey: process.env.INNGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY
});

// Add explicit logging at function creation time
console.log("📝 Registering function: sync-user-from-clerk with trigger: clerk/user.created");

const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk',
        name: 'Sync User from Clerk',
        triggers: [{ event: 'clerk/user.created' }]
    },
    async ({ event }) => {
        logClerkEvent(event, 'User created');

        try {
            const createdUser = await upsertClerkUser(event.data);
            if (!createdUser) {
                return { success: false, error: 'missing user id' };
            }
            console.log("✅ User synced to Neon:", createdUser.id);
            return { success: true, userId: createdUser.id };
        } catch (error) {
            console.error("❌ Failed to sync user to Neon:", error);
            return { success: false, error: error?.message || error };
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
        logClerkEvent(event, 'User deleted');
        const id = getClerkUserId(event.data);

        try {
            await prisma.user.delete({ where: { id } });
            console.log("✅ User deleted from Neon:", id);
            return { success: true };
        } catch (error) {
            console.warn("⚠️ User delete failed or user not found:", id, error?.message || error);
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
        logClerkEvent(event, 'User updated');

        try {
            const updatedUser = await upsertClerkUser(event.data);
            if (!updatedUser) {
                return { success: false, error: 'missing user id' };
            }
            console.log("✅ User updated in Neon:", updatedUser.id);
            return { success: true, userId: updatedUser.id };
        } catch (error) {
            console.error("❌ Failed to update user in Neon:", error);
            return { success: false, error: error?.message || error };
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
        logClerkEvent(event, 'Session created');

        try {
            const createdUser = await upsertClerkUser(event.data);
            if (createdUser) {
                console.log("✅ Session login user synced to Neon:", createdUser.id);
                return { success: true, userId: createdUser.id };
            }
            console.warn("⚠️ Session login event contained no user id, skipping Neon upsert", event.data);
            return { success: true, warning: 'no user id in session event' };
        } catch (error) {
            console.error("❌ Failed to sync session login user to Neon:", error);
            return { success: false, error: error?.message || error };
        }
    }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, sessionRemoved, sessionCreated];

console.log(`✅ Total ${functions.length} functions registered successfully`);