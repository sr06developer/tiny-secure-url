# tiny-secure-url

A solution to ensure guaranteed success of campaigns without data loss from UTM parameters.

# Approach

 - The marketing team enters the campaign URL with the based URL and all
   the UTM parameters in the UI. A unique hashed URL is generated for
   this URL, which the marketing team can share with customers for their
   campaigns.
   
 - This hash for the URL is saved in the backed DB. Once the
   user clicks on the hashed URL, on landing, the hash is extracted and
   the corresponding original URL is fetched and redirected along with
   all the original UTM parameters, hence ensuring lossless campaigns.


- The hashed URLs are single-use and after being used once, they are
   marked as used and from the next time the user will be redirected to
   the expired page.

# Architecture Followed

 - Front end - HTML, CSS, JavaScript
	- **Reason for selecting** : *To maintain a light weight UI as it is not a customer facing web-app.*
- Backend - Node.js with Express
	- **Reason for selecting** :  *To handle requests efficiently, and also to connect to DB as there are native drivers available. (Python, PHP (Laravel), GoLang can also be used).*
- Database - MongoDB
	- **Reason for selecting** - *Flexibility of Data, as the URL should not have length constraint, and also to have lossless data, as SQL can truncate the data.*

# Solution Architecture Diagram

![FlowDiagram](/UI/assets/img/flow1.png)

# Link to Demo Video

### https://1drv.ms/v/s!AgqAaymBEiKQfFazPJz0Wigdjsg?e=g3iKpn