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

(async function getStories() {
  const response = await axios.get(`${API}/stories`, {
    params: { skip: 0, limit: 20 },
  });

  storyList = response.data.stories.map((story) => story);

  makeHTMLStory(storyList, $allArticleList);

  checkIfLoggedIn();
})();

async function checkIfLoggedIn() {
  const name = localStorage.getItem("username");
  const tkn = localStorage.getItem("token");

  if (name === null || tkn === null) return;

  $("#user-profile").hide();
  userProfle();

  $logout.toggleClass("hidden");
  $userNav.toggleClass("hidden");
}

async function displayCurrentStories() {
  const response = await axios.get(`${API}/stories`, {
    params: { skip: 0, limit: 20 },
  });

  storyList = response.data.stories.map((story) => story);

  makeHTMLStory(storyList, $allArticleList);
}

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

async function getUserFavs() {
  const username = localStorage.getItem("username");
  const tkn = localStorage.getItem("token");
  const response = await axios.get(`${API}/users/${username}`, {
    params: { token: tkn },
  });
  const userFavs = response.data.user.favorites;
  return userFavs;
}

async function toggleUserFavorites(id, method) {
  const username = localStorage.getItem("username");
  const tkn = localStorage.getItem("token");
  await axios({
    method: `${method}`,
    url: `${API}/users/${username}/favorites/${id}`,
    data: { token: tkn },
  });
}

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
}

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

const userProfle = () => {
  const username = localStorage.getItem("username");
  $("#nav-welcome").show();
  $("#nav-user-profile").text(`${username}`);
  $("#nav-login").hide();
};

const makeHTMLStory = (storyList, DOMAppendElement, icon = "") => {
  DOMAppendElement.text("");
  for (let story of storyList) {
    let hostName = getHostName(story.url);
    const $item = $(`<li id="${story.storyId}" class="${story.storyId}">
                      ${icon}
                      <span class="star">
                      <i class="far fa-star"></i>
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

const clearSubmitValues = () => {
  $("#author").val("");
  $("#title").val("");
  $("#url").val("");
};

const getValuesSignUp = () => {
  const name = $("#create-account-name").val();
  const username = $("#create-account-username").val();
  const password = $("#create-account-password").val();
  const userData = { name, username, password };
  return userData;
};

const getValuesLogin = () => {
  const username = $("#login-username").val();
  const password = $("#login-password").val();
  const userData = { username, password };
  return userData;
};

const getSubmitValues = () => {
  const author = $("#author").val();
  const title = $("#title").val();
  const url = $("#url").val();
  const userData = { author, title, url };
  return userData;
};

const setLocalStorage = () => {
  if (user) {
    localStorage.setItem("token", user.token);
    localStorage.setItem("username", user.user.username);
    localStorage.setItem("createdAt", user.user.createdAt);
    localStorage.setItem("name", user.user.name);
  }
};

const toggleLoginCreateForm = () => {
  $allArticleList.toggleClass("hidden");
  $loginForm.toggleClass("hidden");
  $createAccount.toggleClass("hidden");
};

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

//Event Handlers

$createAccount.on("submit", async (evt) => {
  evt.preventDefault();
  await createUser();
  toggleLoginCreateForm();
  $logout.toggleClass("hidden");
});

$loginForm.on("submit", async (evt) => {
  evt.preventDefault();
  await login();
  toggleLoginCreateForm();
  $logout.toggleClass("hidden");
});

$navLogin.on("click", (evt) => {
  evt.preventDefault();
  toggleLoginCreateForm();
});

$logout.on("click", (evt) => {
  evt.preventDefault();
  localStorage.clear();
  location.reload();
});

$navSubmit.on("click", (evt) => {
  evt.preventDefault();
  $submitForm.toggleClass("hidden");
});

$submitForm.on("submit", async (evt) => {
  evt.preventDefault();
  await postStory();
});

$navStories.on("click", async (evt) => {
  evt.preventDefault();
  $allArticleList.toggleClass("hidden");
  $userStories.toggleClass("hidden");
  getUserStories();
});

$body.on("click", ".trash-can", async (evt) => {
  const tkn = localStorage.getItem("token");
  const id = $(evt.target).closest("li").attr("id");
  await axios({
    method: "DELETE",
    url: `${API}/stories/${id}`,
    data: { token: tkn },
  });
  getUserStories();
  displayCurrentStories();
});

$userFavLink.on("click", async (evt) => {
  evt.preventDefault();
  $allArticleList.toggleClass("hidden");
  $userFavStories.toggleClass("hidden");
  const userFavs = await getUserFavs();
  if (userFavs.length === 0) {
    $userFavStories.html('<p class="lead">Nothing here..</p>');
  } else {
    makeHTMLStory(userFavs, $userFavStories);
  }
});

//fix this logic !! favorites are not behaving correctly!!
$body.on("click", ".star", async (evt) => {
  const id = $(evt.target).closest("li").attr("id");
  let userFavs = await getUserFavs();

  if (userFavs.length === 0) {
    toggleUserFavorites(id, "POST");
  } else {
    for (let story of userFavs) {
      if (story.storyId === id) {
        toggleUserFavorites(id, "DELETE");
      } else {
        toggleUserFavorites(id, "POST");
      }
    }
  }
});

$brand.on("click", (evt) => {
  evt.preventDefault();
  $allArticleList.show();
  $("#user-profile").hide();
});

$("#nav-welcome").on("click", (evt) => {
  evt.preventDefault();
  populateProfileInfo();
  $allArticleList.hide();
  $("#user-profile").show();
});
