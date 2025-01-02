// Основной URL API и эндпоинты
const apiUrl = 'http://178.20.209.14:9004/api/v1/';
const endpoints = [
    { name: 'contact', method: 'POST', url: 'contact' },
    { name: 'instrumentAll', method: 'GET', url: 'instrument/all' },
    { name: 'exchangerAll', method: 'GET', url: 'exchanger/all' },
    { name: 'exchangerRates', method: 'GET', url: 'exchanger/rates' },
];
const defaultExchangeRateParams =
    {
        fromCurrency: 'BTC',
        fromNetwork: 'BTC',
        toCurrency: 'XMR',
        toNetwork: 'XMR',
        amount: '0.1',
        rateType: 'rate'
    };
// Хранилище данных обменников и управление состоянием загрузки
let exchangersData = new Map(); // Используем Map для хранения данных с уникальными ключами
let exchangers = [];

/**
 * Функция для получения данных с API
 * @param {string} endpointName - Название эндпоинта
 * @param {Object} params - Параметры запроса
 * @param method
 * @returns {Promise<Object>} - Возвращает промис с данными из API
 */
async function fetchData(endpointName, params = {}, method = 'GET') {
    const endpoint = endpoints.find(e => e.name === endpointName);
    if (!endpoint) throw new Error(`Endpoint "${endpointName}" not found.`);

    const url = new URL(`${apiUrl}${endpoint.url}`);

    const options = {
        method: method,
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json' // Указываем, что отправляем JSON
        },
    };

    // Если метод POST или PUT, добавляем тело запроса
    if (method === 'POST' || method === 'PUT') {
        options.body = JSON.stringify(params); // Преобразуем объект params в JSON
    } else {
        url.search = new URLSearchParams(params); // Для GET запроса добавляем параметры в URL
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) throw new Error(`Error fetching data from "${endpointName}": ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from "${endpointName}":`, error);
        throw error;
    }
}

/**
 * Универсальная функция для обновления выбранной валюты в дропдауне (для любой стороны)
 * @param {Object} exchanger - Данные обменника
 * @param {string} side - Сторона ('left' или 'right')
 */
function updateSelected(exchanger, side) {
    const selectedSide = document.querySelector(`#selected-${side}`);
    const selectedImage = selectedSide.querySelector('img.korm');
    const selectedCurrencyName = selectedSide.querySelector('.setting__currency-valut-name');
    const selectedNetworkName = selectedSide.querySelector('.setting__currency-valut-sub-name');
    const searchInput = document.querySelector(`#${side}Search`);

    searchInput.value = exchanger.currency;
    if (selectedImage) {
        selectedImage.src = exchanger.imageUrl;
        selectedImage.alt = exchanger.currency;
    }

    if (selectedCurrencyName) {
        selectedCurrencyName.textContent = exchanger.currency;
    }

    if (selectedNetworkName) {
        selectedNetworkName.textContent = exchanger.network;
    }
}












let pageLeft = 0;
let pageRight = 0;
let isLoadingLeft = false;
let isLoadingRight = false;
let leftDropDownData = [];
let rightDropDownData = [];
let searchTimeouts = { left: null, right: null };
let currentSearchTexts = { left: '', right: '' };
const searchDebounceTimeout = 300;

// Обработчик ввода текста в поле поиска с дебаунсом
async function handleSearchInput(event, side) {
    const searchValue = event.target.value.trim();

    // Если строка поиска пустая, сбрасываем данные
    if (searchValue.length < 3) {
        const dropdown = document.querySelector(`.token__block.${side === 'left' ? 'exchange' : 'receipt'}`);
        dropdown.innerHTML = ''; // Очищаем результаты поиска
        side === 'left' ? leftDropDownData = [] : rightDropDownData = [];
        return;
    }

    // Применяем debounce для уменьшения количества запросов
    clearTimeout(searchTimeouts[side]);
    searchTimeouts[side] = setTimeout(async () => {
        // Если запрос уже был сделан, игнорируем новый
        if (searchValue === currentSearchTexts[side]) return;

        currentSearchTexts[side] = searchValue;

        const dropdown = document.querySelector(`.token__block.${side === 'left' ? 'exchange' : 'receipt'}`);
        dropdown.innerHTML = '<div class="loading">Loading...</div>'; // Показываем индикатор загрузки

        // Сбрасываем массив данных перед загрузкой новых
        side === 'left' ? leftDropDownData = [] : rightDropDownData = [];

        // Сбрасываем номер страницы для нового запроса
        if (side === 'left') pageLeft = 0;
        else pageRight = 0;

        try {
            const params = { page: side === 'left' ? pageLeft : pageRight, pageSize: 20, search: searchValue };
            const data = await fetchData('instrumentAll', params);
            dropdown.innerHTML = ''; // Очищаем перед обновлением
            if (data && data.content) {
                updateDropdown(data.content, side, searchValue); // Обновляем dropdown
            } else {
                dropdown.innerHTML = '<div class="no-results">No results found</div>';
            }
        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
        }
    }, searchDebounceTimeout);
}

// Загрузка данных для выпадающего списка
async function loadDropdownData(side, defaultCurrency) {
    // Проверяем, если идет загрузка данных
    if ((side === 'left' && isLoadingLeft) || (side === 'right' && isLoadingRight)) {
        return;
    }

    // Определяем параметры запроса
    const params = {
        page: side === 'left' ? pageLeft : pageRight,
        pageSize: 20,
        search: defaultCurrency || '', // Параметр поиска
    };

    console.log(`Запрос для ${side} на страницу ${side === 'left' ? pageLeft : pageRight}`);

    // Устанавливаем флаг загрузки
    if (side === 'left') isLoadingLeft = true;
    else isLoadingRight = true;

    try {
        const data = await fetchData('instrumentAll', params);
        console.log(`Ответ от сервера для ${side}:`, data);

        if (data && data.content && data.content.length > 0) {
            updateDropdown(data.content, side, defaultCurrency);

            // Увеличиваем номер страницы
            if (side === 'left') pageLeft++;
            else pageRight++;

        } else {
            console.log(`Нет данных для ${side}`);
        }
    } catch (error) {
        console.error(`Ошибка загрузки данных для ${side}:`, error);
    } finally {
        if (side === 'left') isLoadingLeft = false;
        else isLoadingRight = false;
    }
}

// Обновление выпадающего списка
function updateDropdown(dropDownData, side, defaultCurrency) {
    const dropdown = document.querySelector(`.token__block.${side === 'left' ? 'exchange' : 'receipt'}`);
    const currentData = side === 'left' ? leftDropDownData : rightDropDownData;

    dropDownData.forEach((exchanger) => {
        const key = `${exchanger.currency}-${exchanger.network}`;
        if (!currentData.some(item => `${item.currency}-${item.network}` === key)) {
            currentData.push(exchanger);
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'token__line';
            dropdownItem.dataset.token = exchanger.currency;
            dropdownItem.dataset.network = exchanger.network;
            dropdownItem.innerHTML = `
                <div class="token__img">
                    <img src="${exchanger.imageUrl}" alt="${exchanger.currency}" />
                </div>
                <div class="token__line-bx">
                    <div class="token__line-ttl">${exchanger.currency}</div>
                    <div class="token__line-txt">${exchanger.network}</div>
                </div>
            `;
            if (exchanger.currency === defaultCurrency && exchanger.network === defaultCurrency) {
                dropdownItem.classList.add('active-border');
                document.querySelector('.sear').innerHTML = defaultCurrency;
                document.querySelector('#amount').value = 0.1;
                updateSelected(exchanger, side);
            }
            dropdown.appendChild(dropdownItem);
        }
    });
}

// Привязка обработчиков к полям ввода
const leftSearchInput = document.getElementById('leftSearch');
const rightSearchInput = document.getElementById('rightSearch');

if (leftSearchInput) {
    leftSearchInput.addEventListener('input', (event) => handleSearchInput(event, 'left'));
}

if (rightSearchInput) {
    rightSearchInput.addEventListener('input', (event) => handleSearchInput(event, 'right'));
}

// Привязка обработчиков скролла
document.querySelector('.token__block.exchange')?.addEventListener('scroll', (event) =>
    handleDropdownScroll(event, 'left', document.querySelector('#leftSearch').value ?? defaultExchangeRateParams.fromCurrency)
);

document.querySelector('.token__block.receipt')?.addEventListener('scroll', (event) =>
    handleDropdownScroll(event, 'right', document.querySelector('#rightSearch').value ?? defaultExchangeRateParams.toCurrency)
);

// Загрузка данных для обеих сторон
async function loadExchangeCurrencyData(defaultCurrencyLeft, defaultCurrencyRight) {
    if (isLoadingLeft || isLoadingRight) return;

    try {
        isLoadingLeft = true;
        isLoadingRight = true;

        const [dataLeft, dataRight] = await Promise.all([
            fetchData('instrumentAll', { page: pageLeft, pageSize: 20, search: defaultCurrencyLeft }),
            fetchData('instrumentAll', { page: pageRight, pageSize: 20, search: defaultCurrencyRight }),
        ]);

        if (dataLeft && dataLeft.content) {
            updateDropdown(dataLeft.content, 'left', defaultCurrencyLeft);
            pageLeft++;
        }

        if (dataRight && dataRight.content) {
            updateDropdown(dataRight.content, 'right', defaultCurrencyRight);
            pageRight++;
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    } finally {
        isLoadingLeft = false;
        isLoadingRight = false;
    }
}

// Обработчик прокрутки для загрузки данных
function handleDropdownScroll(event, side, defaultCurrency) {
    const dropdown = event.target;
    // Проверяем, если мы достигли конца списка (почти)
    if (dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight - 50) {
        loadDropdownData(side, defaultCurrency);
    }
}

loadExchangeCurrencyData(defaultExchangeRateParams.fromCurrency, defaultExchangeRateParams.toCurrency);













// Функция для отображения обменников (partners)
async function displayExchangers() {
    try {
        exchangers = await fetchData('exchangerAll'); // Запрос данных с API
        const swiperWrapper = document.querySelector('.partners__swiper');
        const partnersCount = document.querySelector('.partners__numb');
        partnersCount.innerHTML = exchangers.length;

        swiperWrapper.innerHTML = ''; // Очищаем контейнер
        exchangers.forEach(exchanger => {
            const slide = document.createElement('div');
            slide.className = 'partners__slide swiper-slide';
            slide.innerHTML = `
                <div class="partners__card">
                    <div class="partners__card-top">
                        <a href="${exchanger.url}" class="partners__card-ava" target="_blank">
                            <img src="img/ton3.svg?_v=1735141995477" alt="${exchanger.title}" />
                        </a>
                        <div class="partners__card-box">
                            <div class="partners__card-value">${new URL(exchanger.url).hostname.replace(/\/$/, '')}</div>
                        </div>
                    </div>
                    <div class="partners__card-bottom">
                        <a class="link fiol">With us since 2021</a>
                    </div>
                </div>
            `;
            swiperWrapper.appendChild(slide);
        });
    } catch (error) {
        console.error('Error displaying exchangers:', error);
    }
}




// Вызываем функцию для отображения обменников
displayExchangers();

let filteredData = [];

async function getExchangeRate(fromCurrency, fromNetwork, toCurrency, toNetwork, amount, sortType) {
    try {
        const params = { fromCurrency, fromNetwork, toCurrency, toNetwork, amount };
        const response = await fetchData('exchangerRates', params);
        filteredData = sortData(filterData(response), sortType);
        updateExchangersDisplay(filteredData, fromCurrency, toCurrency, amount);
    } catch (error) {
        console.error('Error getting exchange rate:', error);
    }
}

document.querySelector('.btn.setting__submit').addEventListener('click', async function (e) {
    e.preventDefault();
    const {fromCurrency, fromNetwork, toCurrency, toNetwork, amount} = getSelectedCurrenciesAndAmount();
    const sortType = getActiveTabSortType();

    // Находим контейнер, в котором нужно отобразить лоадер
    const exchangersContainer = document.querySelector('.exchangers__container');
    // Показываем лоадер в контейнере
    showLoader(exchangersContainer);
    try {
        // Получаем данные обмена
        await getExchangeRate(fromCurrency, fromNetwork, toCurrency, toNetwork, amount, sortType);

        // После получения данных скрываем лоадер
        hideLoader(exchangersContainer);

    } catch (error) {
        // В случае ошибки скрываем лоадер и выводим сообщение
        hideLoader(exchangersContainer);
        console.error('Error getting exchange rate:', error);
    }
});


['rate', 'popularity'].forEach(sortType => {
    document.getElementById(`sortBy${capitalize(sortType)}`).addEventListener('click', function (e) {
        e.preventDefault();
        setActiveTab(sortType);
        sortAndUpdateDisplay(filteredData, sortType);
    });
});

function getSelectedCurrenciesAndAmount() {
    const selectedLeft = document.querySelector('#selected-left');
    const selectedRight = document.querySelector('#selected-right');
    const fromCurrency = selectedLeft.querySelector('.setting__currency-valut-name').textContent;
    const fromNetwork = selectedLeft.querySelector('.setting__currency-valut-sub-name').textContent;
    const toCurrency = selectedRight.querySelector('.setting__currency-valut-name').textContent;
    const toNetwork = selectedRight.querySelector('.setting__currency-valut-sub-name').textContent;
    const amount = document.querySelector('#amount').value || 0.1;

    return { fromCurrency, fromNetwork, toCurrency, toNetwork, amount };
}

function getActiveTabSortType() {
    return document.querySelector('.exchangers__tabs-title.acccccc').id === 'sortByPopularity' ? 'popularity' : 'rate';
}

function setActiveTab(tabType) {
    document.querySelectorAll('.exchangers__tabs-title').forEach(tab => tab.classList.remove('acccccc'));
    document.getElementById(`sortBy${capitalize(tabType)}`).classList.add('acccccc');
}

function sortAndUpdateDisplay(data, sortType) {
    const sortedData = sortData(data, sortType);
    const { fromCurrency, fromNetwork, toCurrency, toNetwork, amount } = getSelectedCurrenciesAndAmount();
    updateExchangersDisplay(sortedData,fromCurrency,toCurrency,amount);
}

function sortData(data, sortType) {
    if (sortType === 'rate') {
        return data.sort((a, b) => b.rate - a.rate);
    } else if (sortType === 'popularity') {
        const popularityOrder = ['swapuz', 'fixed float', 'swaponix', 'swapter', 'quickex'];

        // Сначала получаем данные из Map с помощью exchangerId
        return data.sort((a, b) => {
            // Находим данные обменников по exchangerId
            const aExchanger = exchangers.find(exchanger => exchanger.id === a.exchangerId);
            const bExchanger = exchangers.find(exchanger => exchanger.id === b.exchangerId);

            // Если данные обменников найдены
            if (aExchanger && bExchanger) {
                const aTitle = (aExchanger.title || '').toLowerCase();
                const bTitle = (bExchanger.title || '').toLowerCase();

                const aIndex = popularityOrder.indexOf(aTitle); // Индекс по порядку популярности для a
                const bIndex = popularityOrder.indexOf(bTitle); // Индекс по порядку популярности для b

                // Если оба элемента не найдены в popularityOrder, их оставляем в исходном порядке
                if (aIndex === -1 && bIndex === -1) return 0;

                // Если только один элемент не найден, он идет в конец списка
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;

                // Сортируем по индексу в popularityOrder
                return aIndex - bIndex;
            }
            return 0; // Если нет данных для обменника, оставляем порядок как есть
        });
    }
    return data;
}


function filterData(data) {
    return data.filter(item => !item.isFailed && item.rate !== null && !isNaN(item.rate));
}

function updateExchangersDisplay(data, fromCurrency, toCurrency, amount) {
    const exchangersContainer = document.querySelector('.exchangers__container');
    const fragment = document.createDocumentFragment();
    const exchangersBody = exchangersContainer.querySelector('.exchangers__body');
    const exchangersBodies = exchangersContainer.querySelectorAll('.exchangers__body');
    if(exchangersBody){
        exchangersBody.innerHTML = '';
    }
    exchangersBodies.forEach(body => body.remove());  // Remove old body elements

    data.forEach((item, index) => {
        const exchanger = exchangers.find(e => e.id === item.exchangerId);
        if (exchanger) {
            const exchangerElement = createExchangerElement(exchanger, item, fromCurrency, toCurrency, amount, index);
            fragment.appendChild(exchangerElement);
        }
    });

    exchangersContainer.appendChild(fragment);
}

function createExchangerElement(exchanger, item, fromCurrency, toCurrency, amount, index) {
    const bestTag = exchanger.title.toLowerCase() === 'swapuz' ? `<div class="exchangers__date-best" data-translate="main.best">BEST</div>` : '';
    const exchangerElement = document.createElement('div');
    exchangerElement.classList.add('exchangers__body');
    exchangerElement.style.marginTop = '1%';
    exchangerElement.innerHTML = `
        <div class="exchangers__date-box">
            <div class="exchangers__date-image">
                <img src="img/ezer.png?_v=1735141995477" alt="" />
                <div class="count">${index + 1}</div>
            </div>
            <div class="exchangers__date-names">
                <div class="exchangers__date-name">${exchanger.title}</div>
                <a href="${exchanger.url}" class="exchangers__date-url" target="_blank"><span>${new URL(exchanger.url).hostname.replace(/\/$/, '')}</span></a>
            </div>
            ${bestTag}
        </div>
        <div class="exchangers__date-info">
            <div class="exchangers__date-col">1 ${fromCurrency} = ${parseFloat(item.rate/amount).toFixed(8).replace(/(\.0+|(\.[0-9]*[1-9])0+)$/, "$1")} ${toCurrency}</div>
            <div class="exchangers__date-col">
                <div class="exchangers__date-txt" data-translate="main.you_receive">You receive</div>
                <div class="exchangers__date-ttl">${parseFloat(item.rate).toFixed(8).replace(/(\.0+|(\.[0-9]*[1-9])0+)$/, "$1")} ${toCurrency}</div>
            </div>
            <div class="exchangers__date-col">
                <button type="button" class="btn-rev">
                    <img class="exchangers__date-image2" src="img/revrite.png?_v=1735141995477" alt="" />
                </button>
            </div>
        </div>
    `;
    return exchangerElement;
}


getExchangeRate(defaultExchangeRateParams.fromCurrency,defaultExchangeRateParams.fromNetwork,defaultExchangeRateParams.toCurrency,defaultExchangeRateParams.toNetwork,defaultExchangeRateParams.amount,defaultExchangeRateParams.rateType)

// Функция для показа лоадера в указанном контейнере
function showLoader(container) {
    // Создаем элемент div для лоадера
    const loader = document.createElement('div');
    loader.classList.add('loader'); // Присваиваем класс для стилизации лоадера

    // Добавляем стили лоадера через JavaScript
    loader.style.width = '50px';
    loader.style.position = 'relative';
    loader.style.left = '50%';
    loader.style.padding = '8px';
    loader.style.aspectRatio = '1';
    loader.style.borderRadius = '50%';
    loader.style.backgroundColor = '#25b09b';
    loader.style.mask = 'conic-gradient(#0000 10%, #000), linear-gradient(#000 0 0) content-box';
    loader.style.webkitMask = 'conic-gradient(#0000 10%, #000), linear-gradient(#000 0 0) content-box';
    loader.style.webkitMaskComposite = 'source-out';
    loader.style.maskComposite = 'subtract';
    loader.style.animation = 'l3 1s infinite linear';

    // Добавляем лоадер в указанный контейнер
    container.appendChild(loader);

    // Добавляем стили для анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes l3 {
            to {
                transform: rotate(1turn);
            }
        }
    `;
    document.head.appendChild(style);
}


// Обработчик отправки формы по клику на кнопку
document.querySelector('.contacts__form').addEventListener('submit', async function (e) {
    e.preventDefault(); // Предотвращаем стандартное поведение формы (перезагрузку страницы)
    console.log("Form submitted");

    // Сбор данных с формы
    const formData = new FormData(this);

    // Получаем выбранную тему
    const selectedTopicElement = document.querySelector('#selectedTopic');
    const selectedTopic = selectedTopicElement ? selectedTopicElement.textContent : '';

    // Добавляем тему в данные формы
    formData.append('topic', selectedTopic);

    // Подготовка данных для отправки на сервер
    const dataToSend = {};
    formData.forEach((value, key) => {
        dataToSend[key] = value;
    });

    console.log('Data to send:', dataToSend);

    // Используем fetchData для отправки данных
    try {
        const data = await fetchData('contact', {
            method: 'POST',
            body: JSON.stringify(dataToSend),
        });

        console.log('Ответ от сервера:', data);

        // Обработка успешного ответа от сервера
        alert('Message sent successfully!');
    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        alert('An error occurred while sending the message.');
    }
});




// Функция для скрытия лоадера
function hideLoader(container) {
    const loader = container.querySelector('.loader');
    if (loader) {
        loader.remove(); // Удаляем лоадер из контейнера
    }
}


function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

