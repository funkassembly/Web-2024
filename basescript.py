import json
import random

# Function to update the JSON with random stock values
def add_stock_to_items(input_file, output_file):
    # Load the JSON data from the input file
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Iterate over each item in the 'items' list
    for item in data['items']:
        # Generate a random stock value less than 500
        stock_value = random.randint(1, 499)
        # Add the 'stock' key with the random value
        item['stock'] = stock_value
    
    # Write the updated JSON to the output file
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Updated JSON with stock values saved to {output_file}")

# Example usage:
input_file = 'C:\Users\nozix\Desktop\webbb\newdb.json'  # Replace with your input JSON file path
output_file = 'updated_json.json'  # Replace with your desired output file path

# Run the function to modify the JSON and save the result
add_stock_to_items(input_file, output_file)
