// ==UserScript==
// @name         Winner Selection Script v.1.8 Beta
// @description  Automates the process of picking winners from the first post's like list in forum giveaways. Ensures a fair and transparent winner selection.
// @namespace    https://github.com/Zw3tty/WinnerSelectionScript
// @version      1.8 Beta
// @author       NotZw3tty
// @match        https://gamesense.pub/forums/viewtopic.php?id=*
// @match        https://gamesense.pub/forums/pmsnew.php?mdl=post
// @grant        none
// @updateURL    https://github.com/Zw3tty/WinnerSelectionScript/raw/main/GiveawayWinnerPicker.user.js
// @downloadURL  https://github.com/Zw3tty/WinnerSelectionScript/raw/main/GiveawayWinnerPicker.user.js
// @supportURL   https://github.com/Zw3tty/WinnerSelectionScript/issues
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    // Configuration variable: Set to 1 to force add buttons, 0 to follow normal conditions
    const forceUIDAddButtons = 0;

    // Function to send messages to all winners
    async function sendMessagesToWinners(usernames) {
        const csrfToken = document.querySelector('input[name="csrf_hash"]').value;
        const subject = document.querySelector('input[name="req_subject"]').value; // Get the subject from the form
        const message = document.querySelector('textarea[name="req_message"]').value; // Get the message from the form
        let successCount = 0;
        let failCount = 0;

        for (const username of usernames) {
            try {
                const isSuccess = await sendMessageToWinner(username, subject, message, csrfToken);
                if (isSuccess) {
                    successCount++;
                } else {
                    failCount++;
                }
                // Wait for a certain amount of time before sending the next message
                await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay
            } catch (error) {
                console.error(`Error sending message to ${username}:`, error);
                failCount++;
            }
        }

        alert(`${successCount}/${usernames.length} messages sent successfully. ${failCount} failed.`);
    }

    // Function to send a message to a winner
    function sendMessageToWinner(winnerUsername, subject, message, csrfToken) {
        return new Promise((resolve, reject) => {
            const url = 'https://gamesense.pub/forums/pmsnew.php?mdl=post';
            const params = new URLSearchParams();
            params.append('csrf_hash', csrfToken);
            params.append('req_addressee', winnerUsername);
            params.append('req_subject', subject); // Use the custom subject
            params.append('req_message', message); // Use the custom message
            params.append('submit', 'Submit');

            fetch(url, {
                method: 'POST',
                body: params,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            .then(response => response.ok ? resolve(true) : resolve(false))
            .catch(() => resolve(false));
        });
    }

    // Function to extract user data from the like list
    function getUserData(likelistId) {
        try {
            const users = [];
            document.querySelectorAll(`#${likelistId} li a`).forEach((element) => {
                const username = element.textContent.trim();
                const uid = getUserIdFromHref(element.href);
                if (uid && !element.classList.contains('usergroup-6')) {
                    users.push({ username, uid });
                }
            });
            return users;
        } catch (error) {
            console.error('Error in getUserData:', error);
            return [];
        }
    }

    // Function to select random winners from user data using crypto API for better randomness
    function pickWinners(userData, numberOfWinners) {
        try {
            if (numberOfWinners < 1 || numberOfWinners > userData.length) {
                alert("Invalid number of winners. Please choose a number between 1 and " + userData.length);
                return [];
            }

            const winners = [];
            while (winners.length < numberOfWinners) {
                if (userData.length === 0) break;
                const randomIndex = window.crypto.getRandomValues(new Uint32Array(1))[0] % userData.length;
                winners.push(userData.splice(randomIndex, 1)[0]);
            }

            return winners.length ? winners : null;
        } catch (error) {
            console.error('Error in pickWinners:', error);
            return [];
        }
    }
    
    // Function to generate formatted output for winners
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

    // Function to extract user ID from href attribute
    function getUserIdFromHref(href) {
        try {
            const match = href.match(/id=(\d+)/);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Error in getUserIdFromHref:', error);
            return null;
        }
    }

    // Function to add buttons to the first post's footer for winner selection and copying
    function addButtonsToFirstPostFoot() {
        try {
            const loggedInUserId = getUserIdFromHref(document.querySelector('#navprofile a').href);
            const postAuthorId = getUserIdFromHref(document.querySelector('.postleft dt a').href);

            // Check if the force add feature is enabled or if the logged-in user is the post author
            if (forceUIDAddButtons === 1 || loggedInUserId === postAuthorId) {
                const firstPostFootRight = document.querySelector('.postfootright > ul');
                if (!firstPostFootRight) {
                    console.log('Post footer not found.');
                    return;
                }

                // Create 'Pick Winners' button
                const pickWinnersLink = createButton('Pick Winners');
                const pickWinnersLi = wrapInListItem(pickWinnersLink);
                firstPostFootRight.appendChild(pickWinnersLi);

                let copyWinnersLiRef = { current: null };  // Reference object for the 'Copy Winners' button

                pickWinnersLink.addEventListener('click', function(event) {
                    event.preventDefault();
                    handlePickWinnersClick(firstPostFootRight, pickWinnersLink, copyWinnersLiRef);
                });
            } else {
                console.log('User is not the author of the post and force add is disabled, not adding Giveaway Picker buttons.');
            }
        } catch (error) {
            console.error('Error in addButtonsToFirstPostFoot:', error);
        }
    }

    // Function to add messaging interface
    function addMessagingInterface() {
        try {
            // Select the container where the textarea for the message is
            const txtAreaDiv = document.querySelector('.inform .infldset.txtarea');
            if (!txtAreaDiv) {
                throw new Error('The message area (infldset txtarea) was not found.');
            }

            // Create the new label and input for bulk messaging
            const bulkLabel = document.createElement('label');
            bulkLabel.className = 'required';
            bulkLabel.innerHTML = '<strong>Winners <span>(Separated by commas)</span></strong><br>';

            const bulkInput = document.createElement('input');
            bulkInput.type = 'text';
            bulkInput.className = 'longinput'; // Ensuring consistent styling
            bulkInput.name = 'usernames';
            bulkInput.placeholder = 'Enter usernames separated by commas';

            bulkLabel.appendChild(bulkInput);
            txtAreaDiv.appendChild(bulkLabel); // Append the new label and input to the txtAreaDiv

            // Find the container of the form buttons
            const buttonsContainer = document.querySelector('.buttons');
            if (!buttonsContainer) {
                throw new Error('The buttons container was not found.');
            }

            // Create the 'Message Winners' button
            const messageWinnersButton = document.createElement('input');
            messageWinnersButton.type = 'button';
            messageWinnersButton.value = 'Message Winners';
            messageWinnersButton.className = 'button'; // Ensure it matches site styling

            // Insert the button at the end of the buttons container
            buttonsContainer.appendChild(messageWinnersButton);

            // Event listener for the 'Message Winners' button to handle messaging
            messageWinnersButton.addEventListener('click', function() {
                const usernames = bulkInput.value.split(',').map(u => u.trim().replace(/^@/, ''));
                const estimatedTimeMinutes = Math.ceil(usernames.length * 30 / 60);
                alert(`This will take around ${estimatedTimeMinutes} minutes. Please do not close this window or turn off your PC.`);
                sendMessagesToWinners(usernames);
            });
        } catch (error) {
            console.error('Error creating bulk messaging interface:', error);
            alert('An error occurred while creating the bulk messaging interface. Please check the console for more details.');
        }
    }

    // Function to create a styled button
    function createButton(text) {
        const button = document.createElement('a');
        button.textContent = text;
        button.href = '#';
        button.style.color = '#60a0dc';
        button.style.fontSize = '11px';
        button.style.cursor = 'pointer';
        return button;
    }

    // Function to wrap an element in a list item
    function wrapInListItem(element) {
        const listItem = document.createElement('li');
        listItem.className = 'postpickgw';
        listItem.appendChild(element);
        return listItem;
    }

    // Function to handle 'Pick Winners' button click
    function handlePickWinnersClick(container, pickWinnersLink, copyWinnersLiRef) {
        const likelistId = document.querySelector('ul.likelist').id;
        const numberOfWinners = prompt("Enter the number of winners: ");
        if (!numberOfWinners) return;

        const userData = getUserData(likelistId);
        const winners = pickWinners(userData, parseInt(numberOfWinners, 10));
        if (winners && winners.length > 0) {
            const winnersText = generateWinnersOutput(winners);
            alert(winnersText);
    
            if (!copyWinnersLiRef.current) {
                copyWinnersLiRef.current = createCopyWinnersButton(winnersText);
                container.appendChild(copyWinnersLiRef.current);
            }
        } else {
            alert("No winners were selected.");
        }
    }

    // Function to create 'Copy Winners' button
    function createCopyWinnersButton(winnersText) {
        const copyWinnersButton = createButton('Copy Winners');
        copyWinnersButton.addEventListener('click', function(e) {
            e.preventDefault();
            navigator.clipboard.writeText(winnersText).then(function() {
                alert('Winners copied to clipboard!');
            }, function(err) {
                console.error('Could not copy text: ', err);
            });
        });
        return wrapInListItem(copyWinnersButton);
    }

    // Main function to initialize the script
    function initializeWinnerSelectionScriptWithMessaging() {
        try {
            // Add existing button functionality
            addButtonsToFirstPostFoot();

            // Add new messaging button functionality
            addMessagingInterface();
        } catch (error) {
            console.error('An error occurred in the Winner Selection Script:', error);
        }
    }

    initializeWinnerSelectionScriptWithMessaging();

})();
