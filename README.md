This simple extension takes your Roam Research page name as a search query for Wikipedia, and returns the extract, featured image and a link to the Wikipedia page.

**New:**
- updated to use Wikimedia API keys
- compatible with Roam Research Hotkeys
- Configure a preferred language for Page Import, Featured Article and On This Day
- Import the featured image of the day

**Note:**
Many of the Wikipedia endpoints now require an API key. You can create a key by going to https://api.wikimedia.org/wiki/Special:AppManagement. Click the 'Create key' button, then fill in any text in the App name and description fields. Select PErsonal API token (for your use only) in the Key type section. Agree to the terms of use and then click the blue 'Create' button.

You will then be presented with a Client ID, Client Secret and Access token. Copy the entire Access token and paste it into the first field in the Roam Depot settings for this extension 'Wikimedia API key'. You should now be able to access the On This Day, Featured Image and Feature Content endpoints.


You can configure the number of sentences from the extract to obtain in the Roam Depot configuration settings, but the default is 6. No other configuration is required, although you can optionally change the language as well.

Trigger this either by:

- Command Palette using the command 'Wikipedia Page Import'
- Using SmartBlocks using the <%WIKIPEDIA%>

Example output:

![image](https://user-images.githubusercontent.com/6857790/188020174-72a7e99c-62e7-4464-a64f-6a6b511565a1.png)

Alternatively, you can import the Featured Article of the Day, Featured Image of the Day or On This Day content.

Both of these options can be triggered via the Command Palette or via SmartBlocks.

- Wikipedia On This Day or <%ONTHISDAY%>
- Wikipedia Featured Content or <%WIKIFEATURED%>
- Wikipedia Featured Image or <%WIKIIMAGE%>

![image](https://user-images.githubusercontent.com/6857790/189469673-fee464b7-567f-40e6-8461-631a1c7cae25.png)
![image](https://user-images.githubusercontent.com/6857790/189469705-ad5a03dc-6445-4dde-a681-472943fb7729.png)

Set your language for general Wikipedia page import by entering a two-letter language code in the 'Wikipedia language' section of the configuration in Roam Depot. Accepted language codes can be found at https://wikistats.wmcloud.org/display.php?t=wp.

You can also select from a limited number of languages for Featured Article and On This Day (Wikipedia only provides this data in a small number of languages).
