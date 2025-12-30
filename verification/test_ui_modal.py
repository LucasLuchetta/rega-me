from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Wait for expo to start
    page.goto("http://localhost:8081")
    page.wait_for_timeout(5000)

    # 1. Add Plant
    print("Navigating to Add Plant...")
    page.get_by_text("Jardim").click()
    page.wait_for_timeout(1000)
    page.get_by_label("Adicionar nova planta").click()
    page.wait_for_timeout(1000)

    print("Filling Plant Form...")
    page.get_by_label("Nome da planta").fill("Test Plant")
    page.get_by_label("Espécie da planta").fill("Test Species")

    # Select Room - using text click
    page.get_by_text("Sala").click()

    # Click Save
    page.get_by_label("Salvar e adicionar planta ao jardim").click()
    page.wait_for_timeout(3000)

    # 2. View Plant Details
    print("Navigating to Plant Details...")
    # Find the new plant in the list. It should be "Test Plant".
    # The TaskItem or PlantItem should be visible.
    # In Dashboard or Garden list.
    # After saving, it goes back. If we are in "Jardim" tab, we might need to go to Dashboard to see tasks?
    # Or navigate to PlantDetails directly if it's listed in Jardim.
    # Let's check where it goes back to. `navigation.goBack()`.
    # Assuming we are back at Jardim list.

    page.get_by_text("Test Plant").first.click()
    page.wait_for_timeout(2000)

    # 3. Verify Task Modal
    print("Clicking a task...")
    # Tasks are listed. "Rega" is default added with frequency 7.
    # Look for "Rega" or "Water" depending on localization, code says 'Rega'.
    page.get_by_text("Rega").first.click()
    page.wait_for_timeout(1000)

    # Take screenshot of the modal with X button
    page.screenshot(path="verification/task_modal.png")
    print("Task modal screenshot taken.")

    # 4. Close Modal using X
    # Find the X button. It's likely an icon, might not have text.
    # We added an X icon in a TouchableOpacity.
    # In my code:
    # <TouchableOpacity ... hitSlop=...> <X ...> </TouchableOpacity>
    # Accessibility? I didn't add explicit accessibilityLabel to the Close button in the new Modal!
    # I should have. But let's try to find it by SVG or position?
    # Or I can fix the code to add accessibilityLabel first.

    # Wait, I didn't add accessibilityLabel to the X button in `src/screens/PlantDetails/index.tsx`.
    # <TouchableOpacity onPress={() => setActionModalVisible(false)} ...> <X ...> </TouchableOpacity>

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
