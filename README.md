# Logseq Linkwarden Plugin

## Getting Started

Setup your connection to the Linkwarden API. You need to generate an Access Token/API Key from the Linkwarden instance.
Paste the base of the URL into Linkwarden Base URL. F.e. when running on localhost:3000, paste `http://localhost:3000` into the field.
Afterwards paste the Access Token/API Key into the Linkwarden API Key field.

## Configuration

You can generate custom properties for every link. The properties are stored in the plugin
configuration. The default properties are:

    year:: ❓;status:: 🟦 Pending

You can also delete or change them.

Currently a custom link status is integrated. You can disable this extension if not needed.
Additionally you can also change the possible states. The default states are:

    🟦 Pending;🟥 Trashed;🟨 First Pass;🟩 Read;🟧 Archived

Feel free, to adapt them to your needs.