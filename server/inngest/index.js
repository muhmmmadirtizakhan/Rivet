import { Inngest } from "inngest";

// Initialize with explicit app name
export const inngest = new Inngest({ 
    id: "my-app",
    name: "Rivet App",
    eventKey: process.env.INNGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY
});

// Add explicit logging at function creation time
console.log("📝 Registering function: sync-user-from-clerk with trigger: user.created");

const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-from-clerk',
        name: 'Sync User from Clerk',
        triggers: [{ event: 'clerk/user.created' }]
    },
    async ({ event }) => {
        console.log("🎯 FUNCTION TRIGGERED! User created:", event.data.id);
        return { success: true, userId: event.data.id };
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
        console.log("🎯 FUNCTION TRIGGERED! User deleted:", event.data.id);
        return { success: true };
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
        console.log("🎯 FUNCTION TRIGGERED! User updated:", event.data.id);
        return { success: true };
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