"""
DOM Extractor - Complete webpage DOM structure extraction system
Extracts full DOM tree with XPath, attributes, visibility, and hierarchy preservation
"""

import json
import uuid
import os
from typing import Dict, List, Any, Optional
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from lxml import etree


class DOMExtractor:
    """Extracts complete DOM structure from a webpage URL"""
    
    def __init__(self, headless: bool = True):
        """
        Initialize the DOM extractor with Selenium WebDriver
        
        Args:
            headless: Run browser in headless mode (default: True)
        """
        self.headless = headless
        self.driver = None
        
    def _setup_driver(self):
        """Setup Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Use system-installed chromedriver (no webdriver-manager)
        self.driver = webdriver.Chrome(options=chrome_options)
        
    def _get_xpath(self, element) -> str:
        """
        Generate unique absolute XPath for an element
        
        Args:
            element: Selenium WebElement
            
        Returns:
            Absolute XPath string
        """
        try:
            script = """
            function getXPath(element) {
                if (element === document.documentElement)
                    return '/html';
                if (element === document.body)
                    return '/html/body';
                if (element.id !== '')
                    return '//' + element.tagName.toLowerCase() + '[@id="' + element.id + '"]';
                
                var ix = 0;
                var siblings = element.parentNode.childNodes;
                for (var i = 0; i < siblings.length; i++) {
                    var sibling = siblings[i];
                    if (sibling === element)
                        return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                    if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                        ix++;
                }
            }
            return getXPath(arguments[0]);
            """
            return self.driver.execute_script(script, element)
        except Exception:
            return ""
    
    def _is_visible(self, element) -> bool:
        """
        Check if element is visible on the page
        
        Args:
            element: Selenium WebElement
            
        Returns:
            True if visible, False otherwise
        """
        try:
            return element.is_displayed()
        except Exception:
            return False
    
    def _get_element_text(self, element) -> str:
        """
        Get direct text content of element (not including children)
        
        Args:
            element: Selenium WebElement
            
        Returns:
            Text content string
        """
        try:
            # Get only the direct text, not from children
            script = """
            var text = '';
            for (var i = 0; i < arguments[0].childNodes.length; i++) {
                var node = arguments[0].childNodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            }
            return text.trim();
            """
            return self.driver.execute_script(script, element)
        except Exception:
            return ""
    
    def _get_attributes(self, element) -> Dict[str, str]:
        """
        Get all attributes of an element
        
        Args:
            element: Selenium WebElement
            
        Returns:
            Dictionary of attribute name-value pairs
        """
        try:
            script = """
            var attrs = {};
            for (var i = 0; i < arguments[0].attributes.length; i++) {
                var attr = arguments[0].attributes[i];
                attrs[attr.name] = attr.value;
            }
            return attrs;
            """
            return self.driver.execute_script(script, element)
        except Exception:
            return {}
    
    def _extract_element(self, element, depth: int = 0) -> Dict[str, Any]:
        """
        Extract complete information for a single element
        
        Args:
            element: Selenium WebElement
            depth: Current depth in DOM tree
            
        Returns:
            Dictionary containing element information
        """
        tag = element.tag_name.lower()
        xpath = self._get_xpath(element)
        attributes = self._get_attributes(element)
        text = self._get_element_text(element)
        visible = self._is_visible(element)
        
        # Get children elements
        children = []
        try:
            child_elements = element.find_elements(By.XPATH, "./*")
            for child in child_elements:
                child_data = self._extract_element(child, depth + 1)
                if child_data:
                    children.append(child_data)
        except Exception:
            pass
        
        return {
            "tag": tag,
            "xpath": xpath,
            "depth": depth,
            "attributes": attributes,
            "text": text,
            "visible": visible,
            "children": children
        }
    
    def extract(self, url: str) -> Dict[str, Any]:
        """
        Extract complete DOM structure from a URL
        
        Args:
            url: Target webpage URL
            
        Returns:
            Dictionary containing URL and complete DOM structure
        """
        try:
            # Setup driver if not already done
            if self.driver is None:
                self._setup_driver()
            
            # Load the page
            self.driver.get(url)
            
            # Wait for page to be fully loaded (including JavaScript)
            WebDriverWait(self.driver, 10).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            
            # Additional wait for dynamic content
            import time
            time.sleep(2)
            
            # Get the root html element
            root_element = self.driver.find_element(By.TAG_NAME, "html")
            
            # Extract the entire DOM tree
            dom_structure = self._extract_element(root_element, depth=0)
            
            return {
                "url": url,
                "dom": dom_structure
            }
            
        except Exception as e:
            raise Exception(f"Failed to extract DOM from {url}: {str(e)}")
    
    def extract_and_save(self, url: str, output_dir: str = ".") -> str:
        """
        Extract DOM and save to a JSON file with unique ID
        
        Args:
            url: Target webpage URL
            output_dir: Directory to save output file (default: current directory)
            
        Returns:
            Path to the generated JSON file
        """
        # Extract DOM
        dom_data = self.extract(url)
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}.json"
        filepath = os.path.join(output_dir, filename)
        
        # Save to JSON file (no explanations, just valid JSON)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(dom_data, f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def close(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


def main():
    """Main function for CLI usage"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python dom_extractor.py <URL> [output_dir]")
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "."
    
    # Extract and save DOM
    with DOMExtractor(headless=True) as extractor:
        output_file = extractor.extract_and_save(url, output_dir)
        print(output_file)


if __name__ == "__main__":
    main()
