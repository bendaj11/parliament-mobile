# Exported widgets

Run `atlas g widget <name> --app=.`. Atlas generates widget source plus `atlas.widget.ts` with stable UUIDv4 identity. Consumers call `sdk.getWidget(widgetId)`; do not maintain widget lists in app config.
