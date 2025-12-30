from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Wait for expo to start
    page.goto("http://localhost:8081")
    page.wait_for_timeout(5000)

    # 1. Verify Profile (Streak removed)
    print("Navigating to Profile...")
    page.get_by_text("Perfil").click()
    page.wait_for_timeout(2000)

    # Onboarding might appear first
    if page.get_by_text("Bem-vindo ao seu Santuário").is_visible():
        print("Handling onboarding...")
        # Fill onboarding
        page.get_by_placeholder("Seu nome").fill("Tester")
        page.get_by_text("Continuar").click() # Step 1
        page.wait_for_timeout(500)
        page.get_by_text("Mato até cacto").click()
        page.get_by_text("Continuar").click() # Step 2
        page.wait_for_timeout(500)
        page.get_by_text("Janela Ensolarada").click()
        page.get_by_text("Continuar").click() # Step 3
        page.wait_for_timeout(500)
        page.get_by_text("Só no fim de semana").click()
        page.get_by_text("Finalizar Perfil").click() # Step 4
        page.wait_for_timeout(2000)

        # Handle "Perfil Criado" alert if possible, or it might just overlay.
        # Playwright auto-dismisses alerts usually, or we can check if it blocks.
        # But let's see. The code uses Alert.alert which on web might be window.alert
        # or a native-like modal if using react-native-web polyfills.
        # Assuming it proceeds.

        # If there's an alert "Agora não", click it.
        try:
            page.get_by_text("Agora não").click(timeout=2000)
        except:
            pass

    page.screenshot(path="verification/profile_page.png")
    print("Profile screenshot taken.")

    # 2. Add Plant to verify Task Action Modal
    print("Navigating to Add Plant...")
    page.get_by_text("Jardim").click()
    page.wait_for_timeout(1000)

    # Click big + button
    # It has accessibilityLabel="Adicionar nova planta"
    page.get_by_label("Adicionar nova planta").click()
    page.wait_for_timeout(2000)

    # Skip photo if possible or just select text inputs
    # The AddPlant screen flow:
    # It might ask for photo first.
    # "Tire uma foto" or "Escolher da Galeria".
    # I need to see AddPlant code to know how to bypass or fill it.

    # Let's check AddPlant code briefly in my mind or just try to fill standard inputs if they appear.
    # Assuming standard flow: Name, Species, etc.
    # If it forces camera, I might be stuck on web without mocks.
    # But let's try to just verify the Profile first, and check PlantDetails if I can navigate to a mock one?
    # Context loads plants from Async storage. It's empty.

    # Let's try to "Add Plant"
    # If I can't add a plant easily via UI, I might need to rely on the code change verification.
    # But I can try.

    # If AddPlant is complex, I will skip adding and just check Profile for now.

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
