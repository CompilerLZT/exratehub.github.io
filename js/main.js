$(document).ready(function() {
    // Загрузка header
    $('#header').load('../components/header.html', function() {
        let currentLang = localStorage.getItem('lang') || 'en';  // Загружаем текущий язык
        loadLanguage(currentLang);  // Загружаем язык

        // Обновление текущего языка в UI
        updateLangText(currentLang);  // Функция для обновления текста выбранного языка

        // Изменение языка
        $('.lang__item').click(function() {
            let selectedLang = $(this).text().toLowerCase();
            loadLanguage(selectedLang);
            localStorage.setItem('lang', selectedLang); // Сохранение языка в localStorage
            updateLangText(selectedLang);  // Обновление текста текущего языка в дропдауне


        });

        // Функция для обновления класса "this" в меню
        function updateMenuHighlight() {
            let path = window.location.pathname; // Получаем текущий путь
            // Удаляем класс "this" у всех ссылок меню
            $('.menu__link').removeClass('this');

            // Проверяем, какой путь текущий, и добавляем класс "this" к соответствующему элементу
            if (path.includes('home.html')) {
                $('.menu__link[href="/home.html"]').addClass('this');
            } else if (path.includes('contacts.html')) {
                $('.menu__link[href="/contacts.html"]').addClass('this');
            }
        }

        // Вызов функции при загрузке страницы
        updateMenuHighlight();
    });

    // Загрузка footer
    $('#footer').load('../components/footer.html');




    // Функция загрузки языка
    function loadLanguage(lang) {
        $.getJSON(`locales/${lang}.json`, function(data) {

            // Обновление тайтла
            $('title').text(data.main.title);
            $('[data-translate="main.title"]').text(data.main.title);
            $('[data-translate="contact.title"]').text(data.contact.title);


            // Обновление данных для header
            $('[data-translate="logoAlt"]').attr('alt', data.header.logoAlt);
            $('[data-translate="menu.main"]').text(data.header.menu.main);
            $('[data-translate="menu.contactUs"]').text(data.header.menu.contactUs);
            $('[data-translate="lang.currentLang"]').text(data.header.lang.currentLang);
            $('[data-translate="lang.otherLangs[0]"]').text(data.header.lang.otherLangs[0]);
            $('[data-translate="lang.otherLangs[1]"]').text(data.header.lang.otherLangs[1]);

            // Обновление данных для main
            $('[data-translate="main.best_crypto_service"]').text(data.main.best_crypto_service);
            $('[data-translate="main.hero_text"]').text(data.main.hero_text);
            $('[data-translate="main.setting_title"]').text(data.main.setting_title);
            $('[data-translate="main.exchange_currency"]').text(data.main.exchange_currency);
            $('[data-translate="main.receipt_currency"]').text(data.main.receipt_currency);
            $('[data-translate="main.search_token"]').text(data.main.search_token);
            $('[data-translate="main.token_placeholder"]').attr('placeholder', data.main.token_placeholder);
            $('[data-translate="main.search_amount_placeholder"]').attr('placeholder', data.main.search_amount_placeholder);
            $('[data-translate="main.search_button"]').text(data.main.search_button);
            $('[data-translate="main.exchangers_title"]').text(data.main.exchangers_title);
            $('[data-translate="main.sort_by_rate"]').text(data.main.sort_by_rate);
            $('[data-translate="main.sort_by_popularity"]').text(data.main.sort_by_popularity);
            $('[data-translate="main.best_exchanger"]').text(data.main.best_exchanger);
            $('[data-translate="main.you_receive"]').text(data.main.you_receive);
            $('[data-translate="main.our_partners"]').text(data.main.our_partners);
            $('[data-translate="main.become_partner"]').text(data.main.become_partner);
            $('[data-translate="main.partners_join_text"]').text(data.main.partners_join_text);
            $('[data-translate="main.best"]').text(data.main.best);

            //Обновление данных для contacts
            $('[data-translate="contact.contactUs"]').text(data.contact.contactUs);
            $('[data-translate="contact.chooseTopic"]').text(data.contact.chooseTopic);
            $('[data-translate="contact.email"]').attr('placeholder', data.contact.email);
            $('[data-translate="contact.message"]').attr('placeholder', data.contact.message);


            $('[data-translate="contact.topics.fundsNotReceived"]').text(data.contact.topics.fundsNotReceived);
            $('[data-translate="contact.topics.amountReceivedIncorrect"]').text(data.contact.topics.amountReceivedIncorrect);
            $('[data-translate="contact.topics.incorrectMemo"]').text(data.contact.topics.incorrectMemo);
            $('[data-translate="contact.topics.wrongNetworkDeposit"]').text(data.contact.topics.wrongNetworkDeposit);
            $('[data-translate="contact.topics.becomePartner"]').text(data.contact.topics.becomePartner);
            $('[data-translate="contact.topics.other"]').text(data.contact.topics.other);
            $('[data-translate="contact.send"]').text(data.contact.send);



            // Обновление данных для footer
            $('[data-translate="footer.copyright"]').text(data.footer.copyright);
            $('[data-translate="footer.socialMedia.soc1"]').text(data.footer.socialMedia.soc1);
            $('[data-translate="footer.socialMedia.soc2"]').text(data.footer.socialMedia.soc2);
            $('[data-translate="footer.socialMedia.soc3"]').text(data.footer.socialMedia.soc3);
            $('[data-translate="footer.socialMedia.soc4"]').text(data.footer.socialMedia.soc4);

        });
    }


    // Функция обновления текста текущего языка в дропдауне
    function updateLangText(lang) {
        let langText;
        switch (lang) {
            case 'en':
                langText = 'EN';
                break;
            case 'ru':
                langText = 'RU';
                break;
            case 'uk':
                langText = 'UK';
                break;
            default:
                langText = lang;
        }
        $('.lang__chois .index').text(langText);
    }
});


