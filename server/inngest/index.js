import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "my-app" });

const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-from-clerk',
        trigger: { event: 'user.created' }  // ✅ Fixed: removed 'clerk/'
    },
    async ({ event }) => {
        const { data } = event;
        console.log("✅ User created event received!");
        console.log("User ID:", data.id);
        console.log("Email:", data.email_addresses?.[0]?.email_address);
        console.log("Name:", data.first_name, data.last_name);
        // TODO: Add database logic here when prisma is installed
    }
);

const syncUserDeletion = inngest.createFunction(
    { 
        id: 'delete-user-with-clerk',
        trigger: { event: 'user.deleted' }  // ✅ Fixed: removed 'clerk/'
    },
    async ({ event }) => {
        const { data } = event;
        console.log("✅ User deleted event received!");
        console.log("User ID:", data.id);
    }
);

const syncUserUpdation = inngest.createFunction(
    { 
        id: 'update-user-with-clerk',
        trigger: { event: 'user.updated' }  // ✅ Fixed: removed 'clerk/'
    },
    async ({ event }) => {
        const { data } = event;
        console.log("✅ User updated event received!");
        console.log("User ID:", data.id);
        console.log("New Email:", data.email_addresses?.[0]?.email_address);
    }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];