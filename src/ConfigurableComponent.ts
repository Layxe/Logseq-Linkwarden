import { PluginSettingsEntity } from "./PluginSettings";

export abstract class ConfigurableComponent {
    abstract configure(settings: PluginSettingsEntity): void;
}