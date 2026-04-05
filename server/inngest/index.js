import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "my-app" });

const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-from-clerk',
        trigger: { event: 'clerk/user.created' }
    },
    async ({ event }) => {
        const { data } = event;
        // TODO: Add database logic here when prisma is installed
        console.log("User created:", data.id);
    }
);

const syncUserDeletion = inngest.createFunction(
    { 
        id: 'delete-user-with-clerk',
        trigger: { event: 'clerk/user.deleted' }
    },
    async ({ event }) => {
        const { data } = event;
        console.log("User deleted:", data.id);
    }
);

const syncUserUpdation = inngest.createFunction(
    { 
        id: 'update-user-with-clerk',
        trigger: { event: 'clerk/user.updated' }
    },
    async ({ event }) => {
        const { data } = event;
        console.log("User updated:", data.id);
    }
);

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];