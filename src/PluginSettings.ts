import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { ConfigurableComponent } from "./ConfigurableComponent"

// Interfaces
// #################################################################################################

export interface PluginSettingsEntity {
    linkwardenHeading: null,
    linkwardenBaseUrl: string,
    linkwardenApiKey: string
    linkwardenCustomProperties: string,
    linkwardenLoadLinkStatus: boolean,
    linkwardenStatusOptions: string
}

// Constants
// #################################################################################################

export const settingsConfig: SettingSchemaDesc[] = [
    {
        key: 'linkwardenHeading',
        title: 'General Settings',
        type: 'heading',
        default: null,
        description: ''
    },
    {
        key: 'linkwardenBaseUrl',
        title: 'Linkwarden Base URL',
        type: 'string',
        default: 'http://localhost:3000',
        description: 'The base URL of your Linkwarden instance.'
    },
    {
        key: 'linkwardenApiKey',
        title: 'Linkwarden API Key',
        type: 'string',
        default: '',
        description: 'API key for your Linkwarden account.'
    },
    {
        key: 'linkwardenCustomProperties',
        title: 'Custom Properties',
        type: 'string',
        default: 'year:: ❓;status:: 🟦 Pending',
        description: 'Custom properties for your Linkwarden links.'
    },
    {
        key: 'linkwardenLoadLinkStatus',
        title: 'Enable Custom Link Status',
        type: 'boolean',
        default: true,
        description: 'Load the extension for easier handling of the link status. If you disable this, you need to restart Logseq.'
    },
    {
        key: 'linkwardenStatusOptions',
        title: 'Link Status Options',
        type: 'string',
        default: '🟦 Pending;🟥 Trashed;🟨 First Pass;🟩 Read;🟧 Archived',
        description: 'Options for the link status. Separated by a semicolon. If you remove or change an option, you need to restart Logseq.'
    }
]

// Class
// #################################################################################################

export class PluginSettings {

    private static _instance: PluginSettings
    private _settings: PluginSettingsEntity
    private _configurableComponents: ConfigurableComponent[] = []

    /**
     * Create a new PluginSettings instance.
     */
    private constructor() {
        logseq.useSettingsSchema(settingsConfig)
        this.updateSettings(logseq.settings)

        logseq.onSettingsChanged(() => {
            if (logseq.settings) {
                this.updateSettings(logseq.settings)
            }
        })
     }

     /**
      * Update the settings for each configurable component.
      * @param settings New settings for the plugin.
      */
     private updateSettings(settings: any) {
        this._settings = settings

        this._configurableComponents.forEach(component => {
            component.configure(this._settings)
        })
     }

     private static getInstance(): PluginSettings {
        if (!this._instance) {
            this._instance = new PluginSettings()
        }

        return this._instance
     }

     /**
      * Register a new configurable component that should be updated with new settings.
      * @param component Configurable component that should be registered.
      */
     public static registerConfigurableComponent(component: ConfigurableComponent) {
        this.getInstance()._configurableComponents.push(component)
     }

     /**
      * Get the current settings for the plugin.
      * @returns The current settings for the plugin.
      */
     public static getSettings(): PluginSettingsEntity {
        return this.getInstance()._settings
     }
}