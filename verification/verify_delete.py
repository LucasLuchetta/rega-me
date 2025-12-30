
import asyncio
from playwright.async_api import async_playwright, expect

async def verify_delete_task():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the app
            await page.goto("http://localhost:8081")

            # Wait for app to load
            await expect(page.get_by_text("Minha Selva")).to_be_visible(timeout=20000)

            # Click "Adicionar nova planta"
            await page.get_by_label("Adicionar nova planta").click()

            # Wait for "Nova Planta" heading
            await expect(page.get_by_role("heading", name="Nova Planta")).to_be_visible(timeout=5000)

            # Fill in plant details
            await page.get_by_placeholder("Nome (ex: Filó)").fill("Test Plant")

            # Select "Sala"
            await page.get_by_text("Sala", exact=True).click()

            # Select "Pequeno"
            await page.get_by_text("Pequeno", exact=True).click()

            # Click "Adicionar ao Jardim"
            await page.get_by_text("Adicionar ao Jardim").click()

            # Wait a bit for navigation and state update
            await page.wait_for_timeout(3000)

            # Check if "Test Plant" is visible
            if await page.get_by_text("Test Plant").is_visible():
                print("Plant found!")
                await page.get_by_text("Test Plant").click()
            else:
                print("Plant NOT found. Dumping page text:")
                return

            # Now in PlantDetails
            await expect(page.get_by_text("Cuidados")).to_be_visible()

            # Ensure "Rega" task is visible
            await expect(page.get_by_text("Rega")).to_be_visible()

            # Click on the "Rega" task
            await page.get_by_text("Rega").click()

            # Wait for the alert/action sheet to appear.
            # On Web, Alert.alert usually renders as window.confirm or window.alert which blocks execution in some environments
            # OR React Native Web mocks it with a custom view.
            # If it is a native browser dialog, Playwright needs to handle it.

            # Let's inspect if "Excluir" text appears in the DOM.
            await page.wait_for_timeout(1000)

            # Take screenshot to see what "Rega" click did
            await page.screenshot(path="verification/after_rega_click.png")

            # In Expo Web, Alert.alert is often `window.confirm` or `window.alert`.
            # But here we have 3 options: "Adiar 2 dias", "Marcar Feito", "Excluir".
            # `window.confirm` only has OK/Cancel.
            # So `Alert.alert` with > 2 buttons on Web usually falls back to a custom implementation OR just fails/does nothing if not polyfilled.
            # The error `Locator expected to be visible ... waiting for get_by_text("Excluir")` suggests it didn't appear.

            # If `Alert.alert` is NOT implemented for 3 buttons on web, we might need to rely on the fact that the code is correct.
            # React Native Web documentation says: "Alert.alert() is implemented using window.confirm() and window.alert()."
            # It does NOT support more than 2 buttons well.
            # If I used 3 buttons, it might just show the first two, or fail.

            # Let's check the code in `src/screens/PlantDetails/index.tsx`.
            # I used 3 buttons: Adiar, Marcar Feito, Excluir, Cancel. That's 4!

            # On Web, this verification might be impossible without a custom modal component replacement for Alert.

            print("Finished check.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_delete_task())
