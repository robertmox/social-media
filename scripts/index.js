/**
 *  Get a list of users
 *  -> first user is your own account, remove from entire list
 *  -> generate own account data
 *  -> generate pagination data
 *  -> create frequency lists of skills and positions
 *  -> generate network feed + establish subscription status for each user (active, blocked, idle, pending) + set badge for most popular skill
 *
 * On page change
 *  -> if new page is the same with current page DO NOTHING!
 *  -> clear current feed
 *  -> set new page as active
 *  -> generate network feed + establish subscription status for each user (active, blocked, idle, pending) + set badge for most popular skill
 */

let networkUsers = [];
let skills = {};
let positions = {};
let currentUser = {};

let mostPopularSkill = '';

const maxDisplayedUsers = 8;
let totalPages = 0;
let currentPage = 1;

const networkFeedElement = document.getElementById('network');
const networkFeedResultsNumberElement =
    document.getElementById('results-number');
const networkFeedPaginationElement =
    document.getElementById('network-pagination');
const accountElement = document.getElementById('account');

function getNetworkUsers() {
    let getNetworkUsersRequest = fetch(
        'https://random-data-api.com/api/v2/users?size=97'
    );
    getNetworkUsersRequest
        .then((response) => response.json())
        .then((data) => {
            networkUsers = data;

            // Preia primul utilizator, ca fiind utilizatorul curent
            currentUser = new NetworkUser(networkUsers[0]);
            createUserProfileElement(currentUser, accountElement);
            // Sterge primul utilizator din lista cu toti utilizatorii
            networkUsers = networkUsers.slice(1);
            totalPages = Math.ceil(networkUsers.length / maxDisplayedUsers);

            getPagesConfiguration();

            for (let networkUser of networkUsers) {
                const user = new NetworkUser(networkUser);

                addSkillToList(user.employment.mainSkill);
                addPositionToList(user.employment.position);
            }

            findMostPopularSkill();

            generateNetworkFeed();
        })
        .catch((error) => {
            console.log(error);
            throw new Error();
        });
}

function addSkillToList(skill) {
    if (skills[skill]) {
        skills[skill] += 1;
    } else {
        skills[skill] = 1;
    }
}

function findMostPopularSkill() {
    let mostPopularSkillCount = 0;

    for (let skill in skills) {
        if (skills[skill] > mostPopularSkillCount) {
            mostPopularSkillCount = skills[skill];
            mostPopularSkill = skill;
        }
    }
}

function addPositionToList(position) {
    if (positions[position]) {
        positions[position] += 1;
    } else {
        positions[position] = 1;
    }
}

function clearNetworkFeed() {
    networkFeedElement.innerHTML = '';
}

function generateNetworkFeed() {
    const startingIndex = (currentPage - 1) * maxDisplayedUsers;
    const endingIndex =
        currentPage === totalPages
            ? networkUsers.length - 1
            : currentPage * maxDisplayedUsers - 1;

    for (let index = startingIndex; index <= endingIndex; index++) {
        const user = new NetworkUser(networkUsers[index]);
        createUserProfileElement(user, networkFeedElement);
    }
}

function createUserProfileElement(user, parentElement) {
    if (!parentElement) {
        return;
    }

    const userProfileElement = document.createElement('div');
    userProfileElement.classList.add('user-profile');
    userProfileElement.id = `user-profile-${user.id}`;

    const userProfileAvatarElement = document.createElement('img');
    userProfileAvatarElement.classList.add('avatar');
    userProfileAvatarElement.src = user.personalData.avatar;
    userProfileAvatarElement.loading = 'lazy';

    userProfileElement.appendChild(userProfileAvatarElement);

    const userProfilePersonalDataElement = document.createElement('div');
    userProfilePersonalDataElement.classList.add('personal-data');

    const userProfilePersonalDataName = document.createElement('p');
    userProfilePersonalDataName.classList.add('full-name');

    const userFullName = document.createTextNode(
        `${user.personalData.firstName} ${user.personalData.lastName}`
    );

    userProfilePersonalDataName.appendChild(userFullName);

    const userProfilePersonalDataJobTitle = document.createElement('p');
    userProfilePersonalDataJobTitle.classList.add('job-title');

    const userJobTitle = document.createTextNode(
        user.employment.mainSkill + ' @ ' + user.employment.position
    );
    userProfilePersonalDataJobTitle.appendChild(userJobTitle);

    userProfilePersonalDataElement.appendChild(userProfilePersonalDataName);
    userProfilePersonalDataElement.appendChild(userProfilePersonalDataJobTitle);

    userProfileElement.appendChild(userProfilePersonalDataElement);

    const userPlanElement = document.createElement('div');
    userPlanElement.classList.add(
        'subscription-plan',
        user.subscription.status.toLowerCase()
    );

    const userPlanText = document.createTextNode(user.subscription.plan);

    userPlanElement.appendChild(userPlanText);

    userProfileElement.appendChild(userPlanElement);

    if (parentElement === accountElement) {
        const userNameElement = document.createElement('span');
        const userNameText = document.createTextNode(
            ` @${user.personalData.username}`
        );

        userNameElement.appendChild(userNameText);

        userProfilePersonalDataName.appendChild(userNameElement);

        const userBioElement = document.createElement('p');
        userBioElement.classList.add('bio');

        const userBioText = document.createTextNode(
            `I am a ${user.employment.mainSkill} ${user.employment.position} from ${user.address.city}, ${user.address.country}.`
        );

        userBioElement.appendChild(userBioText);
        userProfilePersonalDataElement.appendChild(userBioElement);
    }

    if (user.employment.mainSkill === mostPopularSkill) {
        const popularSkillElement = document.createElement('div');
        popularSkillElement.classList.add('popular-skill');
        const popularSkillText = document.createTextNode('Popular Skill');
        popularSkillElement.appendChild(popularSkillText);

        userProfileElement.appendChild(popularSkillElement);
    }

    parentElement.appendChild(userProfileElement);
}

function getPagesConfiguration() {
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const pageNumberElement = document.createElement('div');
        pageNumberElement.classList.add('page-number');
        // Solutia 2
        pageNumberElement.setAttribute('data-page', pageNumber);

        if (pageNumber === currentPage) {
            pageNumberElement.classList.add('active');
        }

        const pageNumberText = document.createTextNode(pageNumber);
        pageNumberElement.appendChild(pageNumberText);

        pageNumberElement.addEventListener('click', (event) => {
            // Solutia 2
            const page = parseInt(event.target.getAttribute('data-page'));

            // Solutia 1
            // const page = parseInt(event.target.innerText);
            if (page === currentPage) {
                return;
            }

            currentPage = page;
            setResultsNumberElement();

            const currentActivePageElement = document.querySelector(
                '.page-number.active'
            );
            currentActivePageElement.classList.remove('active');
            clearNetworkFeed();

            event.target.classList.add('active');
            generateNetworkFeed();
        });

        networkFeedPaginationElement.appendChild(pageNumberElement);
    }

    setResultsNumberElement();
}

// max displayed = 10
// current page = 2 => Showing users from 11 to 20

function setResultsNumberElement() {
    const startingNumber = (currentPage - 1) * maxDisplayedUsers + 1;
    const endingNumber =
        currentPage === totalPages
            ? networkUsers.length
            : currentPage * maxDisplayedUsers;

    networkFeedResultsNumberElement.textContent = `Showing users from ${startingNumber} to ${endingNumber} out of ${networkUsers.length}`;
}

getNetworkUsers();

class NetworkUser {
    id;
    address;
    personalData;
    employment;
    subscription;

    constructor(data) {
        this.id = data.id;

        this.setUserAddress(data.address);
        this.setUserPersonalData(data);
        this.setUserEmploymentData(data.employment);
        this.setUserSubscriptionData(data.subscription);
    }

    setUserAddress(address) {
        this.address = {
            city: address.city,
            country: address.country,
            coordinates: address.coordinates,
        };
    }

    setUserPersonalData(data) {
        this.personalData = {
            firstName: data.first_name,
            lastName: data.last_name,
            dateOfBirth: data.date_of_birth,
            phoneNumber: data.phone_number,
            email: data.email,
            username: data.username,
            avatar: data.avatar,
        };
    }

    setUserEmploymentData(employmentData) {
        this.employment = {
            position: employmentData.title,
            mainSkill: employmentData.key_skill,
        };
    }

    setUserSubscriptionData(subscriptionData) {
        this.subscription = {
            plan: subscriptionData.plan,
            status: subscriptionData.status,
        };
    }
}
