import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IHostNavigationService } from "azure-devops-extension-api";
import { TeamContext } from "azure-devops-extension-api/Core";
import { ReorderOperation, WorkRestClient } from "azure-devops-extension-api/Work";

// Must match `properties.registeredObjectId` of the contribution in vss-extension.json.
const CONTRIBUTION_ID = "move-to-bottom-menu";

// Shape of the action context the backlog item menu hands to `execute`.
// A multi-select passes `ids` / `workItemIds`; a single item passes `id`.
interface IBacklogMenuActionContext {
    id?: number;
    ids?: number[];
    workItemIds?: number[];
}

SDK.register(CONTRIBUTION_ID, () => {
    return {
        execute: async (actionContext: IBacklogMenuActionContext): Promise<void> => {
            const ids =
                actionContext.ids ||
                actionContext.workItemIds ||
                (actionContext.id != null ? [actionContext.id] : []);

            if (ids.length === 0) {
                return;
            }

            const webContext = SDK.getWebContext();
            if (!webContext.project || !webContext.team) {
                // No team backlog in scope: there is nothing to reorder against.
                return;
            }

            const teamContext: TeamContext = {
                projectId: webContext.project.id,
                project: webContext.project.name,
                teamId: webContext.team.id,
                team: webContext.team.name
            };

            // Mirror of the built-in "Move to top" (which sends previousId: 0).
            // nextId: 0 means "end of the list" -> the very bottom. previousId is
            // left unspecified (null) so the service appends after the last item;
            // setting both boundaries to 0 would be contradictory.
            const operation = {
                ids,
                parentId: null,
                iterationPath: null,
                previousId: null,
                nextId: 0
            } as unknown as ReorderOperation;

            await getClient(WorkRestClient).reorderBacklogWorkItems(operation, teamContext);

            // Reflect the new order in the UI.
            const navigationService = await SDK.getService<IHostNavigationService>(
                CommonServiceIds.HostNavigationService
            );
            navigationService.reload();
        }
    };
});

SDK.init();
