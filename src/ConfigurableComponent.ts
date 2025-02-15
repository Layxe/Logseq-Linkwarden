import { PluginSettingsEntity } from "./PluginSettings";

export abstract class ConfigurableComponent {

    /**
     * Configure the component with the new settings.
     * @param settings Logseq Plugin Settings
     */
    abstract configure(settings: PluginSettingsEntity): void;
}