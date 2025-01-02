// Основной URL API и эндпоинты
const apiUrl = 'http://178.20.209.14:9004/api/v1/';
const endpoints = [
    { name: 'contact', method: 'POST', url: 'contact' },
    { name: 'instrumentAll', method: 'GET', url: 'instrument/all' },
    { name: 'exchangerAll', method: 'GET', url: 'exchanger/all' },
    { name: 'exchangerRates', method: 'GET', url: 'exchanger/rates' },
];

// Хранилище данных обменников и управление состоянием загрузки
let exchangersData = new Map(); // Используем Map для хранения данных с уникальными ключами
let exchangers = [];
let page = 0; // Страница для пагинации
let isLoading = false; // Флаг загрузки данных
let leftDropDownData = []; // Данные для левого дропдауна
let rightDropDownData = []; // Данные для правого дропдауна

/**
 * Функция для получения данных с API
 * @param {string} endpointName - Название эндпоинта
 * @param {Object} params - Параметры запроса
 * @returns {Promise<Object>} - Возвращает промис с данными из API
 */
async function fetchData(endpointName, params = {}) {
    const endpoint = endpoints.find(e => e.name === endpointName);
    if (!endpoint) throw new Error(`Endpoint "${endpointName}" not found.`);

    const url = new URL(`${apiUrl}${endpoint.url}`);
    url.search = new URLSearchParams(params);

    try {
        const response = await fetch(url, {
            method: endpoint.method,
            headers: { 'Accept': '*/*' }
        });

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

/**
 * Универсальная функция для обновления дропдауна для любой стороны (левого или правого)
 * @param {Array} dropDownData - Данные для дропдауна (левый или правый)
 * @param {string} side - Сторона ('left' или 'right')
 * @param {string} defaultCurrency - Валюта по умолчанию для выбора
 */
function updateDropdown(dropDownData, side, defaultCurrency) {
    // Выбираем правильный контейнер для дропдауна в зависимости от стороны (левая или правая)
    const dropdown = document.querySelector(`.token__block.${side === 'left' ? 'exchange' : 'receipt'}`);


        dropdown.innerHTML = ''; // Очищаем дропдаун
    dropDownData.forEach(exchanger => {
        const key = `${exchanger.currency}-${exchanger.network}`;
        if (!exchangersData.has(key)) exchangersData.set(key, exchanger); // Добавляем уникальный ключ

        const dropdownItem = document.createElement('div');
        dropdownItem.className = 'token__line';

        // Если это первый вызов и валюта/сеть совпадают с defaultCurrency, добавляем класс active
        if (exchanger.currency === defaultCurrency && exchanger.network === defaultCurrency ) {
            dropdownItem.classList.add('active-border')
            const amountCurrency = document.querySelector('.sear')
            amountCurrency.innerHTML = 'BTC';
            const amount = document.querySelector('#amount')
            amount.value = 0.1
            updateSelected(exchanger, side);
        }

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
        dropdown.appendChild(dropdownItem);
    });
}


async function loadExchangeCurrencyData(defaultCurrencyLeft, defaultCurrencyRight) {
    if (isLoading) return;
    isLoading = true;

    // Параметры для запросов
    const paramsLeft = {
        page: page,
        pageSize: 20,
        search: defaultCurrencyLeft
    };

    const paramsRight = {
        page: page,
        pageSize: 20,
        search: defaultCurrencyRight
    };

    try {
        // Запускаем оба запроса параллельно
        const [dataLeft, dataRight] = await Promise.all([
            fetchData('instrumentAll', paramsLeft),
            fetchData('instrumentAll', paramsRight)
        ]);

        // Обработка данных для левого дропдауна
        if (dataLeft && dataLeft.content) {
            leftDropDownData = [...leftDropDownData, ...dataLeft.content];
            page++; // увеличиваем страницу, если нужно

            // Обновляем левый дропдаун
            updateDropdown(leftDropDownData, 'left', defaultCurrencyLeft);
        }

        // Обработка данных для правого дропдауна
        if (dataRight && dataRight.content) {
            rightDropDownData = [...rightDropDownData, ...dataRight.content];
            page++; // увеличиваем страницу, если нужно

            // Обновляем правый дропдаун
            updateDropdown(rightDropDownData, 'right', defaultCurrencyRight);
        }
    } catch (error) {
        console.error('Error fetching data for exchange currencies:', error);
    } finally {
        isLoading = false;
    }
}





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

// Инициализация загрузки данных при первом запуске
loadExchangeCurrencyData('BTC','XMR'); // Для левого дропдауна по умолчанию загрузим BTC


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
    console.log(sortType,sortedData)
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

            console.log(exchangers)
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
    console.log(exchangersBody,exchangersBodies)
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
            <div class="exchangers__date-col">${amount} ${fromCurrency} = ${parseFloat(item.rate).toFixed(8).replace(/(\.0+|(\.[0-9]*[1-9])0+)$/, "$1")} ${toCurrency}</div>
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


getExchangeRate('BTC','BTC','XMR','XMR','0.1','rate')

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

