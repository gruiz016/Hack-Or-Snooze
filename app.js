//API URL

const API = "https://hack-or-snooze-v3.herokuapp.com";

//Variables that store user and story data

let user;
let storyList;

//DOM selectors
const $body = $("body");
const $brand = $(".navbar-brand");
const $navLogin = $("#nav-login");
const $allArticleList = $("#all-articles-list");
const $loginForm = $("#login-form");
const $createAccount = $("#create-account-form");
const $logout = $("#nav-logout");
const $userNav = $(".main-nav-links");
const $navSubmit = $("#nav-submit");
const $submitForm = $("#submit-form");
const $navStories = $("#nav-my-stories");
const $userStories = $("#my-articles");
const $delete = $(".trash-can");
const $userFavLink = $("#nav-favorites");
const $userFavStories = $("#favorited-articles");

//MAIN APP LOGIC

// gets stories as soon as the page loads
(async function getStories() {
  const response = await axios.get(`${API}/stories`, {
    params: { skip: 0, limit: 20 },
  });

  storyList = response.data.stories.map((story) => story);

  makeHTMLStory(storyList, $allArticleList);

  checkIfLoggedIn();
  $("#user-profile").hide();
})();

//checks if user has localstorage data, so on refresh or closing tab the data presists
async function checkIfLoggedIn() {
  const name = localStorage.getItem("username");
  const tkn = localStorage.getItem("token");

  if (name === null || tkn === null) return;

  $("#user-profile").hide();
  userProfle();

  $logout.toggleClass("hidden");
  $userNav.toggleClass("hidden");
}

//displays recent stories, call this after a deletion
async function displayCurrentStories() {
  const response = await axios.get(`${API}/stories`, {
    params: { skip: 0, limit: 20 },
  });

  storyList = response.data.stories.map((story) => story);

  makeHTMLStory(storyList, $allArticleList);
}

//retries user stories
async function getUserStories() {
  const name = localStorage.getItem("username");
  const tkn = localStorage.getItem("token");
  const response = await axios.get(`${API}/users/${name}`, {
    params: { token: tkn },
  });

  const userList = response.data.user.stories.map((story) => story);

  if (userList.length === 0) {
    return $userStories.html(
      `<p class="lead">No stories added by you yet!</p>`
    );
  }

  makeHTMLStory(
    userList,
    $userStories,
    `<span class="trash-can">
        <i class="fas fa-trash"></i>
      </span>`
  );
}

//gathers the user favorite stories
async function getUserFavs() {
  const username = localStorage.getItem("username");
  const tkn = localStorage.getItem("token");
  const response = await axios.get(`${API}/users/${username}`, {
    params: { token: tkn },
  });
  const userFavs = response.data.user.favorites;
  return userFavs;
}

//methos that toggles either add or remove a favorite
async function toggleUserFavorites(id, method) {
  const username = localStorage.getItem("username");
  const tkn = localStorage.getItem("token");
  await axios({
    method: `${method}`,
    url: `${API}/users/${username}/favorites/${id}`,
    data: { token: tkn },
  });
}

//creates a user
async function createUser() {
  let userData = getValuesSignUp();
  const response = await axios.post(`${API}/signup`, {
    user: {
      name: userData.name,
      username: userData.username,
      password: userData.password,
    },
  });
  user = response.data;
  setLocalStorage();
  populateProfileInfo();
  $userNav.toggleClass("hidden");
  userProfle();
  $("#user-profile").hide();
}

//logins a user in
async function login() {
  const userData = getValuesLogin();
  const response = await axios.post(`${API}/login`, {
    user: { username: userData.username, password: userData.password },
  });
  user = response.data;
  setLocalStorage();
  populateProfileInfo();
  $userNav.toggleClass("hidden");
  userProfle();
  $("#user-profile").hide();
}

//Adds a story
async function postStory() {
  const userData = getSubmitValues();
  const tkn = localStorage.getItem("token");
  const response = await axios.post(`${API}/stories`, {
    token: tkn,
    story: {
      author: userData.author,
      title: userData.title,
      url: userData.url,
    },
  });
  storyList.unshift(response.data.story);
  makeHTMLStory(storyList, $allArticleList);
  $submitForm.toggleClass("hidden");
  clearSubmitValues();
}

//Helper Functions

//Makes the HTML structure for each story, dynamically
const makeHTMLStory = (storyList, DOMAppendElement, icon = "", fav = "far") => {
  DOMAppendElement.text("");
  for (let story of storyList) {
    let hostName = getHostName(story.url);
    const $item = $(`<li id="${story.storyId}" class="${story.storyId}">
                      ${icon}
                      <span class="star">
                      <i class="${fav} fa-star"></i>
                      </span>
                      <a href="${story.url}" class="article-link">
                        <strong>${story.title}</strong>
                      </a>
                      <small class="article-author">by ${story.author}</small>
                      <small class="article-hostname ${hostName}">(${hostName})</small>
                      <small class="article-username">${story.username}</small>
                    </li>`);
    DOMAppendElement.append($item);
  }
};

//creates and displays user data
const populateProfileInfo = () => {
  const profile = $("#user-profile");
  const created = localStorage.getItem("createdAt");
  $item = $(`<h4>User Profile Info</h4>
              <section>
                <div id="profile-name">Name: ${localStorage.getItem(
                  "name"
                )}</div>
                <div id="profile-username">Username: ${localStorage.getItem(
                  "username"
                )}</div>
                <div id="profile-account-date">Account Created: ${created.slice(
                  0,
                  10
                )}</div>
              </section>`);
  profile.html($item);
};

//gathers values from signup form
const getValuesSignUp = () => {
  const name = $("#create-account-name").val();
  const username = $("#create-account-username").val();
  const password = $("#create-account-password").val();
  const userData = { name, username, password };
  return userData;
};

//gathers values from login form
const getValuesLogin = () => {
  const username = $("#login-username").val();
  const password = $("#login-password").val();
  const userData = { username, password };
  return userData;
};

//gathers values from submit form
const getSubmitValues = () => {
  const author = $("#author").val();
  const title = $("#title").val();
  const url = $("#url").val();
  const userData = { author, title, url };
  return userData;
};

//clears submit form
const clearSubmitValues = () => {
  $("#author").val("");
  $("#title").val("");
  $("#url").val("");
};

//sets the local storage
const setLocalStorage = () => {
  if (user) {
    localStorage.setItem("token", user.token);
    localStorage.setItem("username", user.user.username);
    localStorage.setItem("createdAt", user.user.createdAt);
    localStorage.setItem("name", user.user.name);
  }
};

//hide/show login
const toggleLoginCreateForm = () => {
  $allArticleList.hide();
  $loginForm.show();
  $createAccount.show();
};

//removes string elements from url
const getHostName = (url) => {
  let hostName;
  if (url.indexOf("://") > -1) {
    hostName = url.split("/")[2];
  } else {
    hostName = url.split("/")[0];
  }
  if (hostName.slice(0, 4) === "www.") {
    hostName = hostName.slice(4);
  }
  return hostName;
};

//hides elements when toggling
const hide = () => {
  const arr = [
    $userStories,
    $userFavStories,
    $submitForm,
    $("#user-profile"),
    $loginForm,
    $createAccount,
  ];
  arr.forEach((a) => a.hide());
};

//Event Handlers - that toggle sections
//Toggle user profile nav bar, show hidden links
const userProfle = () => {
  const username = localStorage.getItem("username");
  $("#nav-welcome").show();
  $("#nav-user-profile").text(`${username}`);
  $("#nav-login").hide();
};
//Toggling to live feed
$brand.on("click", async (evt) => {
  evt.preventDefault();
  hide();
  $allArticleList.show();
  await displayCurrentStories();
});
//Display User profile information on bottom screen
$("#nav-welcome").on("click", (evt) => {
  evt.preventDefault();
  hide();
  populateProfileInfo();
  $allArticleList.hide();
  $("#user-profile").show();
});
//Toggle login form
$navLogin.on("click", (evt) => {
  evt.preventDefault();
  toggleLoginCreateForm();
});
//Toggle create story form
$navSubmit.on("click", (evt) => {
  evt.preventDefault();
  hide();
  $allArticleList.show();
  $submitForm.show();
});

//Event handlers that manipulate the DOM
//Logout
$logout.on("click", (evt) => {
  evt.preventDefault();
  localStorage.clear();
  location.reload();
});
//Login in
$loginForm.on("submit", async (evt) => {
  evt.preventDefault();
  $allArticleList.show();
  hide();
  $logout.toggleClass("hidden");
  await login();
});
//Create Account
$createAccount.on("submit", async (evt) => {
  evt.preventDefault();
  $allArticleList.show();
  hide();
  $logout.toggleClass("hidden");
  await createUser();
});
//Submit Form
$submitForm.on("submit", async (evt) => {
  evt.preventDefault();
  await postStory();
});
//User Stories
$navStories.on("click", async (evt) => {
  evt.preventDefault();
  hide();
  $allArticleList.hide();
  $userStories.show();
  await getUserStories();
});
//Fav Icon Toggle
const toggleFavIcon = (evt, bool) => {
  if (bool) {
    $(evt.target).toggleClass("far");
    $(evt.target).toggleClass("fas");
  }
  $(evt.target).remove("fas");
  $(evt.target).add("far");
};
//User Fav's
$userFavLink.on("click", async (evt) => {
  evt.preventDefault();
  hide();
  $allArticleList.hide();
  $userFavStories.show();
  const userFavs = await getUserFavs();
  if (userFavs.length === 0) {
    $userFavStories.html('<p class="lead">Nothing here..</p>');
  } else {
    await makeHTMLStory(userFavs, $userFavStories, "", "fas");
  }
});
//Click logic for trash can icon - Deleting Stories
$body.on("click", ".trash-can", async (evt) => {
  const tkn = localStorage.getItem("token");
  const id = $(evt.target).closest("li").attr("id");
  await axios({
    method: "DELETE",
    url: `${API}/stories/${id}`,
    data: { token: tkn },
  });
  await getUserStories();
  await displayCurrentStories();
});
//Click logic for Star icon - Fav-ing a story
$body.on("click", ".star", async (evt) => {
  const id = $(evt.target).closest("li").attr("id");
  let userFavs = await getUserFavs();
  await toggleUserFavorites(id, "POST");
  toggleFavIcon(evt, true);
  userFavs.forEach(async (favs) => {
    if (favs.storyId === id) {
      await toggleUserFavorites(id, "DELETE");
      toggleFavIcon(evt, false);
    }
  });
});
