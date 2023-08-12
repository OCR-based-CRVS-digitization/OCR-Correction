import os
import json
from PIL import Image


def save_fields_as_images(base_pdf_image_path, base_output_path, schema_file):
    # open the schema file and read it
    with open(schema_file, 'r') as f:
        schema = json.load(f)
        for field in schema:
            field_name = field['name']
            field_type = field['type']
            page_number = field['page_number']
            field_regions = field['regions']

            image_path = base_pdf_image_path + str(page_number) + '.jpg'
            image = Image.open(image_path)

            for regionInfo in field_regions:
                output_path = base_output_path + field_type + '/' + field_name + '_' + str(regionInfo['index']) + '.jpg'
                region = regionInfo['region']
                cropped_image = image.crop((region[0], region[1], region[0] + region[2], region[1] + region[3]))
                cropped_image.save(output_path)



if __name__ == '__main__':
    input_path = '../form-images/base-form/'
    output_path = '../form-images/debug/'
    
    #clean the output folder
    for folder in os.listdir(output_path):
        folder_path = os.path.join(output_path, folder)
        for file in os.listdir(folder_path):
            file_path = os.path.join(folder_path, file)
            os.remove(file_path)

    save_fields_as_images(input_path, output_path, 'crvs-schema.json')