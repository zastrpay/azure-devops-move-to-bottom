import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IHostNavigationService } from "azure-devops-extension-api";
import { TeamContext } from "azure-devops-extension-api/Core";
import { ReorderOperation, WorkRestClient } from "azure-devops-extension-api/Work";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

// Must match `properties.registeredObjectId` of the contribution in vss-extension.json.
const CONTRIBUTION_ID = "move-to-bottom-menu";

// Shape of the action context the backlog item menu hands to `execute`.
interface IBacklogMenuActionContext {
    id?: number;
    ids?: number[];
    workItemIds?: number[];
}

// The reorder body expects the iteration's classification-node path, e.g.
// System.IterationPath "C2D\Jun 2026" -> "\C2D\Iteration\Jun 2026".
function toIterationClassificationPath(systemIterationPath: string): string {
    const parts = systemIterationPath.split("\\");
    const project = parts[0];
    const rest = parts.slice(1).join("\\");
    return "\\" + project + "\\Iteration\\" + rest;
}

SDK.register(CONTRIBUTION_ID, () => {
    return {
        execute: async (actionContext: IBacklogMenuActionContext): Promise<void> => {
            try {
                const ids =
                    actionContext.ids ||
                    actionContext.workItemIds ||
                    (actionContext.id != null ? [actionContext.id] : []);
                if (ids.length === 0) {
                    return;
                }

                const web = SDK.getWebContext();
                if (!web.project || !web.team) {
                    return;
                }
                const teamContext: TeamContext = {
                    projectId: web.project.id,
                    project: web.project.name,
                    teamId: web.team.id,
                    team: web.team.name
                };

                const workClient = getClient(WorkRestClient);
                const witClient = getClient(WorkItemTrackingRestClient);

                // 1. The item's own iteration is the sprint backlog we reorder within.
                const item = await witClient.getWorkItem(ids[0], web.project.name, ["System.IterationPath"]);
                const systemIterationPath = item.fields["System.IterationPath"] as string;
                const iterationName = systemIterationPath.split("\\").pop() as string;

                // 2. reorderIterationWorkItems needs the iteration id (it goes in the URL).
                const iterations = await workClient.getTeamIterations(teamContext);
                const iteration =
                    iterations.find(it => it.path === systemIterationPath) ||
                    iterations.find(it => it.name === iterationName);
                if (!iteration) {
                    console.error("[move-to-bottom] iteration not found for", systemIterationPath,
                        iterations.map(it => ({ id: it.id, name: it.name, path: it.path })));
                    return;
                }

                // 3. Find the current last top-level item in the iteration (the "bottom").
                //    Top-level rows have no link type (rel === null); nested Tasks do.
                const iterationItems = await workClient.getIterationWorkItems(teamContext, iteration.id);
                const movedSet = new Set(ids);
                const topLevelIds = iterationItems.workItemRelations
                    .filter(link => !link.rel)
                    .map(link => link.target.id)
                    .filter(id => !movedSet.has(id));
                const previousId = topLevelIds.length ? topLevelIds[topLevelIds.length - 1] : 0;

                // 4. Mirror of the built-in "Move to top" ({previousId:0, nextId:<first>}):
                //    place the selection after the current last item (nextId:0 = end),
                //    scoped to the iteration, leaving the Epic/parent untouched (parentId:0).
                const operation = {
                    ids,
                    parentId: 0,
                    iterationPath: toIterationClassificationPath(systemIterationPath),
                    previousId,
                    nextId: 0
                } as unknown as ReorderOperation;

                await workClient.reorderIterationWorkItems(operation, teamContext, iteration.id);

                // The sprint backlog does NOT auto-refresh reorders (only the Taskboard does),
                // and an extension can't update the host grid in place like the in-process
                // built-in. A reload is the only reliable way to show the new order.
                const nav = await SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);
                nav.reload();
            } catch (err) {
                // Surface the real server error instead of an unhandled "[object Object]".
                console.error("[move-to-bottom] reorder failed:", JSON.stringify(err), err);
            }
        }
    };
});

SDK.init();
