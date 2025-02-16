import { ConfigurableComponent } from "./ConfigurableComponent"
import { PluginSettingsEntity } from "./PluginSettings"

export class LinkwardenLinkStatusHandler extends ConfigurableComponent {

    private static _instance: LinkwardenLinkStatusHandler
    private _settings: PluginSettingsEntity

    private constructor() {
        super()
    }

    public static getInstance(): LinkwardenLinkStatusHandler {
        if (!this._instance) {
            this._instance = new LinkwardenLinkStatusHandler()
        }

        return this._instance
    }

    public configure(settings: PluginSettingsEntity) {
        this._settings = settings
        this.registerSlashCommands()
    }

    private async changeStatus(status: string) {
        const block = await logseq.Editor.getCurrentBlock()

        await logseq.Editor.exitEditingMode(false)

        if (block === null || block.properties === undefined) {
            return
        }

        let lines = block.content.split("\n")

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("status::")) {
                lines[i] = "status:: " + status
            }
        }

        let newContent = lines.join("\n")

        // Update the block multiple times to ensure that the status is updated.
        // Sometimes it won't update on the first try.
        for (let i = 0; i < 3; i++) {
            await logseq.Editor.updateBlock(block.uuid, newContent)
        }
    }

    private registerSlashCommands() {
        if (!this._settings.linkwardenLoadLinkStatus) {
            return
        }

        let statusOptions = this._settings.linkwardenStatusOptions.split(";")

        for (const status of statusOptions) {
            logseq.Editor.registerSlashCommand("Status: " + status, async () => {
                this.changeStatus(status)
            })

        }

    }

}