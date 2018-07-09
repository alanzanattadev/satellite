# Youtube Fetcher

### Dependencies required

- requests
- pymongo

### Additional informations needed

- [Google ApiKey](https://console.cloud.google.com/apis/credentials?pli=1&project=dulcet-order-153315&folder&organizationId) for *Youtube Data API v3*
- Mongodb server up and running
- Informations of connection through mongoDB database (Still hard coded **TODO**)

### Features

- Fetch ChannelID by youtube Username
- Fetch all subscriptions that the user subscribe to
- Fetch playlists created by the user
- Fetch music inside playlist created by the user

### API

- `YTFetcher` class
    - `YTFetcher()`: Input
        - `apiKey`: string, Your api Key that google give you
        - `ytUsername`: string, Your youtube username or your channelId if you don't have any username
        Also provides:
            - `channelID`: string, once call `getChannelID()`
            - `client`: db, client mongodb
            - `db`: db, database connection mongodb
            - `subscriptions`: connection, database connection to the collection `subscriptions`
            - `playlists`: connection, database connection to the collection `playlists`
            - `playlistsItems`: connection, database connection to the collection `playlistsItems` 
            - `playlistsIds`: Array<string>, every Id of the playlist create by the user
    - `getChannelID()`: return your channelID given your `ytUsername`, **only if you don't already have your channelID**
    - `fetcher()`: Input
        - `typeFetching`: string, either be `subscriptions` or `playlists`, fetch data either about subscriptions or playlist.
        - `collectionDep`: db.collection, Colletion used to insert in mongodb platform, variable are already populated, `self.subscription` || `self.playlists`
        - `maxResultsPerPage`: Number, Optional, number of entry per page fetch.
    - `fetcherPlaylistMusic()`: Input
        - `maxResultsPerPage`: Number, *Optional*, number of entry per page fetch.

### Discuss Implementation (API)

- `fetcher()` and `fetcherPlaylistMusic()`, insert directly in database
- Some method depends on others...
- Some features that we can possibly add...
- How deal with the Database (Clean/Connection/When no DB exist or Collection...)

### Additional informations behavior about mongodb

- Collections and databases are created automatically if they doesn't exists

### Working Example

```python
fetch = YTFetcher(os.environ["APIKEY"], os.environ["YTUSERNAME"]) # Instanciate the fetcher with APIKEY provided by google and the YTUSERNAME that you provide
fetch.getChannelID() # If and only if you don't already have the channelID.
fetch.fetcher("playlists", fetch.playlists, 5) # Fetch the different playlists 
fetch.fetcherPlaylistMusic() # Fetch the different musics present in these playlists
```