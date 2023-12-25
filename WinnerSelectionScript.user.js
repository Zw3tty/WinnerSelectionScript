// ==UserScript==
// @name         Winner Selection Script
// @description  Automates the process of picking winners from the first post's like list in forum giveaways. Ensures a fair and transparent winner selection.
// @namespace    https://github.com/Zw3tty/WinnerSelectionScript
// @version      1.7
// @author       NotZw3tty
// @match        https://gamesense.pub/forums/viewtopic.php?id=*
// @grant        none
// @updateURL    https://github.com/Zw3tty/WinnerSelectionScript/raw/main/GiveawayWinnerPicker.user.js
// @downloadURL  https://github.com/Zw3tty/WinnerSelectionScript/raw/main/GiveawayWinnerPicker.user.js
// @supportURL   https://github.com/Zw3tty/WinnerSelectionScript/issues
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    function getUserData(likelistId) {
        const users = [];
        document.querySelectorAll(`#${likelistId} li a`).forEach((element) => {
            const username = element.textContent.trim();
            const uid = element.href.match(/id=(\d+)/)[1];
            if (!element.classList.contains('usergroup-6')) {  // exclude banned users
                users.push({ username, uid });
            }
        });
        return users;
    }

    function pickWinners(userData, numberOfWinners) {
        if (numberOfWinners < 1 || numberOfWinners > userData.length) {
            alert("Invalid number of winners. Please choose a number between 1 and " + userData.length);
            return [];
        }
    
        const winners = [];
        while (winners.length < numberOfWinners) {
            if (userData.length === 0) break;
            const randomIndex = Math.floor(Math.random() * userData.length);
            winners.push(userData.splice(randomIndex, 1)[0]); // Remove the selected winner
        }
    
        if (winners.length === 0) {
            console.error("No winners selected.");
            return [];
        }
    
        return winners;
    }
    
    function generateWinnersOutput(winners) {
        const formatChoice = prompt(
            "Choose the output format:\n" +
            "1: @Username (ID: XXXXX)\n" +
            "2: Username (ID: XXXXX)\n" +
            "3: @Username\n" +
            "4: Username\n" +
            "5: @Username (ID: XXXXX), each on new line\n" +
            "6: Username (ID: XXXXX), each on new line\n" +
            "7: @Username, each on new line\n" +
            "8: Username, each on new line\n" +
            "Enter a number from 1 to 8:"
        );
    
        let formatFunction;
        switch (formatChoice) {
            case '1':
                formatFunction = user => `@${user.username} (ID: ${user.uid})`;
                break;
            case '2':
                formatFunction = user => `${user.username} (ID: ${user.uid})`;
                break;
            case '3':
                formatFunction = user => `@${user.username}`;
                break;
            case '4':
                formatFunction = user => `${user.username}`;
                break;
            case '5':
                formatFunction = user => `@${user.username} (ID: ${user.uid})`;
                break;
            case '6':
                formatFunction = user => `${user.username} (ID: ${user.uid})`;
                break;
            case '7':
                formatFunction = user => `@${user.username}`;
                break;
            case '8':
                formatFunction = user => `${user.username}`;
                break;
            default:
                formatFunction = user => `@${user.username} (ID: ${user.uid})`;
        }
    
        let winnersText = "Winners:";
        if (['5', '6', '7', '8'].includes(formatChoice)) {
            winnersText += "\n" + winners.map(formatFunction).join('\n');
        } else {
            winnersText += " " + winners.map(formatFunction).join(', ');
        }
    
        return winnersText;
    }

    const allowedUserIds = new Set(['2', '415', '985', '14668']); // UIDs with force permissions

    function getUserIdFromHref(href)  {
        const match = href.match(/id=(\d+)/);
        return match ? match[1] : null;
    }

    function addButtonsToFirstPostFoot() {
        const loggedInUserId = getUserIdFromHref(document.querySelector('#navprofile a').href);
        const postAuthorId = getUserIdFromHref(document.querySelector('.postleft dt a').href);
        
        if (loggedInUserId === postAuthorId || allowedUserIds.has(loggedInUserId)) {
            const firstPostFootRight = document.querySelector('.postfootright > ul');
            if (firstPostFootRight) {
                const pickWinnersLi = document.createElement('li');
                pickWinnersLi.className = 'postpickgw';

                const pickWinnersLink = document.createElement('a');
                pickWinnersLink.textContent = 'Pick Winners';
                pickWinnersLink.href = '#';
                pickWinnersLink.style.color = '#60a0dc';
                pickWinnersLink.style.fontSize = '11px';
                pickWinnersLink.style.cursor = 'pointer';
                pickWinnersLi.appendChild(pickWinnersLink);

                firstPostFootRight.appendChild(pickWinnersLi);

                let copyWinnersLi;  // will be created after winners are picked

                pickWinnersLink.onclick = function(event) {
                    event.preventDefault();
                    const likelistId = document.querySelector('ul.likelist').id;
                    const numberOfWinners = prompt("Enter the number of winners: ");
                    if (numberOfWinners) {
                        const userData = getUserData(likelistId);
                        const winners = pickWinners(userData, parseInt(numberOfWinners, 10));
                        if (winners.length > 0) {
                            const winnersText = generateWinnersOutput(winners);
                            alert(winnersText);

                            if (!copyWinnersLi) {
                                copyWinnersLi = document.createElement('li');
                                copyWinnersLi.className = 'postcopygw';

                                const copyWinnersButton = document.createElement('a');
                                copyWinnersButton.textContent = 'Copy Winners';
                                copyWinnersButton.href = '#';
                                copyWinnersButton.style.color = '#60a0dc';
                                copyWinnersButton.style.fontSize = '11px';
                                copyWinnersButton.style.cursor = 'pointer';
                                copyWinnersButton.onclick = function(e) {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(winnersText).then(function() {
                                        alert('Winners copied to clipboard!');
                                    }, function(err) {
                                        console.error('Could not copy text: ', err);
                                    });
                                };

                                copyWinnersLi.appendChild(copyWinnersButton);
                                firstPostFootRight.appendChild(copyWinnersLi);
                            }
                        } else {
                            alert("No winners were selected.");
                        }
                    }
                };
            }
        } else {
            console.log('User is not the author of the post, not adding Giveaway Picker buttons.');
        }
    }

    addButtonsToFirstPostFoot();
})();
