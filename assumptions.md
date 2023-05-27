# Assumptions

 - A complete end-to-end solution using front and backend can be used.
 - The URLs with UTM Parameters need not be encrypted on-the-fly, this is not possible, as there is no mechanism from Google Analytics to decrypt them.
 - So the most feasible approach would be to maintain unique hash for every campaign URL and refer this hash to fetch the original URL with all the UTM Params intact and use it for the campaign to prevent data losses due to long URLs.
 - Using a single-use hashed URL is sufficient to maintain the privacy of the customers
 - The users will be shared with a shortened URL with the hash which will not have the original domain, but will be informed by the marketing team about the safety of the URL to click on them. *(As this is already the case for bitly, tinyurl etc.)*
