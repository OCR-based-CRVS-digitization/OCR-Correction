
import csv
import json
import re
from PIL import Image

def get_region_from_row(row):
    left = int(row[0])
    top = int(row[1])
    width  = int(row[2]) - int(row[0])
    height = int(row[3]) - int(row[1])
    if row[6] != '' :
        index = int(row[6]) - 1
    else :
        index = 0
    return {"index" : index, "region" : [left, top, width, height]}


def get_average_brightness(imagePath, region):
    '''This function returns the average brightness of the region
    the function is used for checkboxes only'''
    # open the image
    image = Image.open(imagePath)
    # crop the image
    cropped_image = image.crop((region[0], region[1], region[0] + region[2], region[1] + region[3]))
    # convert the image to grayscale
    grayscale_image = cropped_image.convert('L')
    # get the histogram of the image
    histogram = grayscale_image.histogram()
    # calculate the average brightness
    total_brightness = 0
    total_pixels = 0
    for i in range(256):
        total_brightness += i * histogram[i]
        total_pixels += histogram[i]
    average_brightness = total_brightness / total_pixels
    return average_brightness

def old_field_creator(csv_file, json_file):
    data = []
    done_fields = {'dummy'}
    
    # Read data from the CSV file
    with open(csv_file, 'r') as csvfile:
        csvreader = csv.reader(csvfile)
        rows = list(csvreader)
        for i in range(1, len(rows)):
            row = rows[i]
            page_number = row[4]
            field_name = row[5]
            field_type = row[7]
            if field_name in done_fields:
                continue

            regions = []
            regions.append(get_region_from_row(row))
            while True:
                if i+1 < len(rows) and rows[i+1][5] != field_name:
                    break
                i += 1
                if i >= len(rows):
                    break
                row = rows[i]
                regions.append(get_region_from_row(row))
            data.append({
                "name": field_name,
                "type": field_type,
                "page_number": page_number,
                "regions": regions
            })
            done_fields.add(field_name)
            
    # print(data)
    
    # Write data to the JSON file
    with open(json_file, 'w') as jsonfile:
        json.dump(data, jsonfile, indent=2)


def new_field_creator(file, json_file):
    '''This function creates a json file from the new coordinates file'''
    # open the file
    pattern = r'(\d+) x (\d+) @ \((\d+), (\d+)\)'
    data = []
    with open(file, 'r') as txtfile:
        lines = txtfile.readlines()
        for line in lines:
            # if the line starts with a letter
            if line[0].isalpha():
                fragments = line.strip().split(',')
                field_name = fragments[0]
                field_type = fragments[1]
                page_number = fragments[2]
                regions = []
                index = 0
            elif line == '\n':
                data.append({
                    "name": field_name,
                    "type": field_type,
                    "page_number": page_number,
                    "regions": regions
                })
            else :
                # populate the regions list
                line = line.strip().split(':')
                match = re.search(pattern, line[0])
                
                if match:
                    width = int(match.group(1))
                    height = int(match.group(2))
                    left = int(match.group(3))
                    top = int(match.group(4))
                    if field_type == 'CHECKBOX' :
                        # get the non filled form Image
                        entry = line[1] # the entry name is after the ':' symbol
                        input_path = '../form-images/base-form/' + page_number + '.jpg'
                        brightness = get_average_brightness(input_path, [left, top, width, height])
                        regions.append({"index" : index, "region" : [left, top, width, height], "entry" : entry, "brightness" : brightness})
                    else :
                        regions.append({"index" : index, "region" : [left, top, width, height]})
                    index += 1

        with open(json_file, 'w') as jsonfile:
            json.dump(data, jsonfile, indent=2)

        

if __name__ == "__main__":
    csv_file = 'region(new).txt'
    json_file = 'crvs-schema.json'
    new_field_creator(csv_file, json_file)
