const { Notify } = require('node-dbus-notifier');
const CDP = require('chrome-remote-interface');
const [node, path, textToTranslate, sourceLang, notify] = process.argv;
// текст для перевода
if (!textToTranslate) {
  textToTranslate = 'Please Older versions may use  may use may useMath.random()';
}

// listen to standard input and set the text to translate when it receives data
process.stdin.on('data', (data) => {
  textToTranslate = data.toString().trim();
});

// connect to the browser and initiate the translation process
const connectToBrowser = async () => {
  try {
    // create a connection to the browser
    const client = await CDP({ port: 9222 });
    const { Runtime, Page } = client;
    let expression;

    // enable the Page domain in the client
    await Page.enable();
    const { frameTree } = await Page.getResourceTree();

    // expression to be executed in the browser's JavaScript context
    expression = `
      var dlRequestInlineTranslation = {
        "notify": false,
        "action": "dlRequestInlineTranslation",
        "payload": {
          "requests": [{ "text": "${textToTranslate}" }],
          "domainName": "${frameTree?.frame.securityOrigin}",
          "trigger": "inline",
          "sourceLang": "${sourceLang}"
        }
      };

      chrome.runtime.sendMessage(dlRequestInlineTranslation)
      .then((result) => result[0].text)
      .catch(function (error) {
        console.log("error: " + error);
      });
    `;

    // enable the Runtime domain in the client
    Runtime.enable();

    // show a notification with the translated text
    async function showNotification(expression, textToTranslate, uniqueContextId) {
      try {
        // evaluate the expression in the browser's JavaScript context
        const { result } = await Runtime.evaluate({
          uniqueContextId,
          expression,
          includeCommandLineAPI: true,
          awaitPromise: true
        });
    
        // create the notification with the original text and the translated text
if (notify !== undefined) {
	        const notify = new Notify({
	          appName: 'Перевод',
	          summary: textToTranslate,
	          body: result.value,
	          hints: {
	            x: 1100,
	            y: 600
	          },
	          timeout: 3000,
	        });
	    
	        // show the notification
	        const result2 = await notify.show();
	        console.log(`Notification closed: ${JSON.stringify(result2)}`);
}else {
  process.stdout.write(result.value + "\n");
}

// process.on('exit', (code) => {
//   console.log(`Exiting with code: ${code}`);
  
// });

        client.close();
      } catch (error) {
        console.error(`Error: ${error}`);
      } finally {
        client.close();
        process.exit();
      }
    }
    
    // listen for the creation of new execution contexts
    Runtime.executionContextCreated(({ context }) => {
      // when the execution context with the extension's origin is created, show the notification
      // chrome-extension://hdifgjkgacoklfdlgkoandnnminggnkb
      if (context.origin === 'chrome-extension://cofdbpoegempjloogbagkncekinflcnj') {
        const uniqueContextId = context.uniqueId;
        showNotification(expression, textToTranslate, uniqueContextId);
      }
    });
    

  } catch (err) {
    console.error('Error connecting to browser:', err);
  }
};

connectToBrowser();

