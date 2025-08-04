
# Student Discipline Data Analysis Dashboard

An interactive dashboard for analyzing student discipline data across different demographic groups and years.

## Features

- **Overview by Category**: Visualizes discipline rates grouped by Program/Status, Gender, and Race/Ethnicity
- **Trend Analysis**: Shows discipline rate changes from 2021-22 to 2023-24
- **Disparity Analysis**: Highlights gaps compared to the overall student average

## Data Categories

1. **Program/Status Groups**: English Learner, Low income, Students w/disabilities, High needs
2. **Gender Groups**: Male, Female
3. **Race/Ethnicity Groups**: Multiple racial and ethnic categories

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Place your data file (`Updated_DESEMA_Discipline_Calculations.csv`) in the `public/` directory
4. Run the development server: `npm start`

## Technologies Used

- React
- Recharts for data visualization
- PapaParse for CSV parsing
- Tailwind CSS for styling