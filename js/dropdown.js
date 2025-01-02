document.addEventListener("DOMContentLoaded", function () {
    // Обрабатываем все блоки валют
    const currencyBlocks = document.querySelectorAll('.setting__currency-block');

    currencyBlocks.forEach(function (block, index) {
        const tokenBlock = block.querySelector('.token__block');
        const tokenInp = block.querySelector('.token__inp');
        const currencyVisionBox = block.querySelector('.setting__currency-vision-box');
        const currencyValutName = currencyVisionBox?.querySelector('.setting__currency-valut-name');
        const currencyValutSubName = currencyVisionBox?.querySelector('.setting__currency-valut-sub-name');
        const currencyValutImg = currencyVisionBox?.querySelector('.korm');

        if (!tokenBlock || !tokenInp || !currencyVisionBox) {
            console.warn(`Missing elements in Block ${index + 1}`);
            return;
        }

        tokenBlock.addEventListener('click', function (e) {
            const target = e.target.closest('.token__line');
            if (!target) return;

            const activeToken = tokenBlock.querySelector('.token__line.active-border');
            activeToken?.classList.remove('active-border');

            target.classList.add('active-border');
            const selectedToken = target.getAttribute('data-token');
            const selectedNetwork = target.getAttribute('data-network');
            if (!selectedToken) {
                console.warn(`Token without data-token in Block ${index + 1}`);
                return;
            }
            const amountCurrency = document.querySelector('.sear');
            amountCurrency.innerHTML = selectedToken;

            const tokenImg = target.querySelector('.token__img img')?.src;
            const tokenName = target.querySelector('.token__line-ttl')?.textContent;
            const tokenSubName = target.querySelector('.token__line-txt')?.textContent;

            if (currencyValutName) currencyValutName.textContent = tokenName || '';
            if (currencyValutSubName) currencyValutSubName.textContent = tokenSubName || '';
            if (currencyValutImg) currencyValutImg.src = tokenImg || '';
        });

    });

    // Получаем текущий язык из localStorage, если не задан, то используем 'en' по умолчанию
    let currentLang = localStorage.getItem('lang') || 'en';

// Обрабатываем все формы с классом .contacts__form
    const contactForms = document.querySelectorAll(".contacts__form");

// Загружаем файл локализации
    let translations = {};

// Функция загрузки локализации
    function loadTranslations(lang) {
        return fetch(`locales/${lang}.json`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to load translations");
                return response.json();
            })
            .then(data => {
                translations = data;
                updateSelectedTopicTranslation(); // Обновляем выбранный текст, если язык изменился
            })
            .catch(error => console.error("Error loading translations:", error));
    }

// Функция для обновления перевода в выбранной теме
    function updateSelectedTopicTranslation() {
        const selectedTextElement = document.querySelector('#selectedTopic');

        const selectTopicTextElement = document.querySelector("[data-translate='contact.chooseTopic']");

        if (selectedTextElement && selectTopicTextElement) {
            // Получаем текущий выбранный токен
            const selectedToken = selectedTextElement.getAttribute('data-selected-token');
            if (selectedToken) {
                // Извлекаем ключ перевода и обновляем текст
                const translationKey = selectedToken.split('.').pop();
                const translatedText = translations.contact?.topics?.[translationKey] || "Translation missing";

                // Ограничиваем текст, если он слишком длинный
                const maxLength = 30;
                const limitedText = translatedText.length > maxLength
                    ? translatedText.substring(0, maxLength) + "..."
                    : translatedText;
                console.log(translatedText)
                // Обновляем текст в "Select a topic" и в выбранной теме
                selectTopicTextElement.textContent = limitedText;
                selectedTextElement.textContent = translatedText;
            }
        }
    }

// Загружаем переводы для текущего языка
    loadTranslations(currentLang).then(() => {
        contactForms.forEach(function (form) {
            const tokenBlock = form.querySelector(".token__block");
            const selectTopicText = form.querySelector("[data-translate='contact.chooseTopic']");
            const tokenTop = form.querySelector(".token__top");

            tokenBlock.addEventListener("click", function (e) {
                const target = e.target.closest(".token__line");
                if (target) {
                    // Снимаем класс "active-border" с предыдущего токена
                    const activeToken = tokenBlock.querySelector(".token__line.active-border");
                    if (activeToken) {
                        activeToken.classList.remove("active-border");
                    }

                    // Добавляем класс "active-border" к новому выбранному токену
                    target.classList.add("active-border");

                    // Получаем значение data-topic выбранного токена
                    const selectedToken = target.getAttribute("data-topic");

                    // Сохраняем выбранный токен в элементе для обновления при смене языка
                    const selectedTextElement = document.querySelector('#selectedTopic');
                    if (selectedTextElement) {
                        selectedTextElement.setAttribute('data-selected-token', selectedToken);
                    }

                    // Обновляем текст на основе текущего языка
                    const translationKey = selectedToken.split('.').pop();
                    const translatedText = translations.contact?.topics?.[translationKey] || "Translation missing";

                    // Ограничиваем текст, если он слишком длинный
                    const maxLength = 30;
                    const limitedText = translatedText.length > maxLength
                        ? translatedText.substring(0, maxLength) + "..."
                        : translatedText;

                    // Обновляем текст в "Select a topic" и выбранной теме
                    selectTopicText.textContent = limitedText;
                    if (selectedTextElement) {
                        selectedTextElement.textContent = translatedText;
                    }

                    // Проверяем наличие кнопки закрытия, чтобы не дублировать её
                    let closeButton = tokenTop.querySelector(".contacts__form-imposter");
                    if (!closeButton) {
                        closeButton = document.createElement('div');
                        closeButton.classList.add('contacts__form-imposter', 'closeeeee');
                        closeButton.innerHTML = '<img src="img/search3.svg?_v=1735141995477" alt="Close">';
                        tokenTop.appendChild(closeButton);
                    }
                }
            });
        });
    });



});
