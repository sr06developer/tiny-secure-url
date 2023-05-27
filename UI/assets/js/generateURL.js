const inputUrl = document.querySelector("#urlInputField");
const inputSource = document.querySelector("#sourceInputField");
const inputMedium = document.querySelector("#mediumInputFiled");
const inputCampaignName = document.querySelector("#campaign_nameInputField");
const inputTerm = document.querySelector("#inputTerm");
const inputContent = document.querySelector("#inputContent");
const form = document.querySelector("#inputForm");
const inputSection = document.querySelector("#inputSection");
const inputCard = document.querySelector("#inputCard");
const resultsDiv = document.querySelector("#resultsDiv");
const loaderSection = document.querySelector("#loaderSection");
const copyBtn = document.querySelector("#copy-btn");

loadEventListeners();

function loadEventListeners() {
  form.addEventListener("submit", createUrl);
}

async function createUrl(e) {
  // Return error if any value is missing
  if (
    inputUrl.value == "" ||
    inputSource.value == "" ||
    inputMedium.value == "" ||
    inputCampaignName.value == "" ||
    inputTerm.value == "" ||
    inputContent.value == ""
  ) {
    showError("Please fill all the parameters !");
  } else {
    // Display the loading Div
    loaderSection.style.display = "block";

    const inputData = {
      base_url: inputUrl.value,
      utm_source: inputSource.value,
      utm_medium: inputMedium.value,
      utm_campaign: inputCampaignName.value,
      utm_term: inputTerm.value,
      utm_content: inputContent.value,
    };

    let hashedURL =
      (await getHashedURLForInput(inputData)) || "An Error Occured !";

    // Create a new Div to show the hashed URL from the API result
    resultDiv = document.createElement("div");
    resultDiv.className = "card my-4";
    let resultDivInput;
    resultDivInput = document.createElement("h2");
    resultDivInput.className = "p-4";
    resultDiv.appendChild(resultDivInput);
    resultDivInput.appendChild(document.createTextNode(hashedURL));
    setTimeout(hideloading, 2000);

    // Displaying result div
    setTimeout(displayResults, 1500);
    function displayResults() {
      resultsDiv.style.display = "block";
      resultsDiv.className = "card-body bg-light lead text-center";
      resultsDiv.innerHTML = resultDivInput.innerHTML;
      copyBtn.style.display = "block";
      e.preventDefault();
    }
  }
}

function showError(error) {
  // Create a new Div to show the error message
  let errorDiv = document.createElement("div");
  errorDiv.className = "alert alert-danger text-center";
  errorDiv.style.color = "red";
  errorDiv.style.fontWeight = "bold";
  errorDiv.appendChild(document.createTextNode(error));
  inputSection.insertBefore(errorDiv, inputCard);
  setTimeout(errorDisappear, 4000);
  function errorDisappear() {
    errorDiv.style.display = "none";
  }
}

function hideloading() {
  loaderSection.style.display = "none";
}

function copyURL() {
  var resultsDiv = document.getElementById("resultsDiv");
  var copiedRow = document.getElementById("copiedRow");
  generatedURL = resultsDiv.innerHTML.replace("&amp;", "&");
  navigator.clipboard.writeText(generatedURL);
  copiedRow.style.display = "block";
  setTimeout(copiedDisappear, 3000);
  function copiedDisappear() {
    copiedRow.style.display = "none";
  }
}

async function getHashedURLForInput(inputData) {
  try {
    let url = "http://localhost:3000/v1/shorten";
    let response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(inputData),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    let jsonRes = await response.json();
    console.log(jsonRes);
    if (jsonRes.hashedUrl) {
      return jsonRes.hashedUrl;
    }
  } catch (err) {
    console.error(JSON.stringify(err));
    if (err.error) {
      showError(err.error);
    }
  }
}
