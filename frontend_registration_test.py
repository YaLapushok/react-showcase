import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
# Укажите путь к вашему chromedriver, если он не в PATH
# webdriver_path = '/path/to/your/chromedriver.exe' 
# service = ChromeService(executable_path=webdriver_path)
# driver = webdriver.Chrome(service=service)

# --- Настройки ---
FRONTEND_URL = "http://localhost:3000/register"
# Генерируем уникальный email каждый раз, чтобы избежать конфликтов
# Либо используйте фиксированный email, если хотите проверить существующий
import random
test_email = f"test_selenium_{random.randint(1000, 9999)}@example.com" 
test_password = "password123"
# Ожидание элементов (в секундах)
WAIT_TIMEOUT = 10 
# --- Конец Настроек ---

driver = None # Инициализируем переменную driver

try:
    print("Запуск Selenium WebDriver...")
    # Если chromedriver в PATH, можно проще:
    driver = webdriver.Chrome() 
    driver.maximize_window()
    print(f"Переход на страницу регистрации: {FRONTEND_URL}")
    driver.get(FRONTEND_URL)

    print("Ожидание загрузки формы регистрации...")
    # Используем явные ожидания для надежности
    email_input = WebDriverWait(driver, WAIT_TIMEOUT).until(
        EC.presence_of_element_located((By.ID, "email")) # Предполагаем, что ID поля email = 'email'
    )
    password_input = driver.find_element(By.ID, "password") # Предполагаем ID = 'password'
    confirm_password_input = driver.find_element(By.ID, "confirmPassword") # Предполагаем ID = 'confirmPassword'
    # Ищем кнопку по тексту внутри нее или по типу submit
    # register_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Register')]") 
    register_button = WebDriverWait(driver, WAIT_TIMEOUT).until(
        EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")) # Ищем кнопку отправки формы
    )

    print(f"Заполнение формы:")
    print(f"  Email: {test_email}")
    print(f"  Password: {test_password}")
    
    email_input.send_keys(test_email)
    time.sleep(0.5) # Небольшая пауза для наглядности
    password_input.send_keys(test_password)
    time.sleep(0.5)
    confirm_password_input.send_keys(test_password)
    time.sleep(1)

    print("Нажатие кнопки регистрации...")
    register_button.click()

    # Добавляем небольшое ожидание, чтобы бэкенд успел обработать (если надо)
    # и чтобы вы увидели результат перед закрытием браузера
    print("\n---")
    print(f"Форма регистрации для пользователя {test_email} отправлена.")
    print("!!! ВАЖНО: Проверьте почту, указанную в настройках .env бэкенда !!!")
    print(f"!!! Ожидается письмо для верификации на адрес {test_email} (если отправка работает) !!!")
    print("Оставьте это окно открытым или проверьте логи бэкенда на наличие ошибок отправки.")
    print("Скрипт завершит работу через 30 секунд...")
    time.sleep(30) # Даем время посмотреть или для ручного перехода по ссылке

except Exception as e:
    print(f"\n--- ПРОИЗОШЛА ОШИБКА ---")
    print(e)

finally:
    if driver:
        print("\nЗакрытие WebDriver...")
        driver.quit()
        print("WebDriver закрыт.") 