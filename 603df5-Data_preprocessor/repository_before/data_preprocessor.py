#!/usr/bin/python3
"""
This module contains a class `DataPreprocessor` that handles the preprocessing
of train, test, and store datasets for a machine learning task. It includes
loading data, merging datasets, handling date features, filling missing values,
and saving the processed data.
"""
import pandas as pd


class DataPreprocessor:
    """
    This class provides methods to preprocess training and testing datasets
    for a machine learning task. It merges store information, extracts date
    features, handles missing values, and saves the processed data.

    Attributes:
        train_data_path (str): Path to the training data CSV file.
        test_data_path (str): Path to the testing data CSV file.
        store_data_path (str): Path to the store information CSV file.
        output_train_path (str): Path to save the processed training data.
        output_test_path (str): Path to save the processed testing data.
    """
    def __init__(
            self, train_data_path, test_data_path,
            store_data_path, output_train_path, output_test_path):
        """
        Initialize the DataPreprocessor with file paths.
        """
        self.train_data_path = train_data_path
        self.test_data_path = test_data_path
        self.store_data_path = store_data_path
        self.output_train_path = output_train_path
        self.output_test_path = output_test_path

    def run(self):
        """
        Execute the data preprocessing steps:

        1. Load the train, test, and store datasets.
        2. Merge store information with train and test datasets.
        3. Convert the 'Date' column to datetime.
        4. Extract date-related features.
        5. Handle missing values.
        6. Save the processed train and test datasets to the specified paths.
        """
        # Load datasets with dtype specifications to handle mixed types
        train = pd.read_csv(self.train_data_path, dtype={'StateHoliday': str})
        test = pd.read_csv(self.test_data_path, dtype={'StateHoliday': str})
        store = pd.read_csv(self.store_data_path)

        # Handle missing values in the store dataset
        median_competition_distance = store['CompetitionDistance'].median()
        store['CompetitionDistance'].fillna(
            median_competition_distance, inplace=True)

        mode_competition_open_since_month = store[
            'CompetitionOpenSinceMonth'].mode()[0]
        store['CompetitionOpenSinceMonth'].fillna(
            mode_competition_open_since_month, inplace=True)

        mode_competition_open_since_year = store[
            'CompetitionOpenSinceYear'].mode()[0]
        store['CompetitionOpenSinceYear'].fillna(
            mode_competition_open_since_year, inplace=True)

        mode_promo2_since_week = store['Promo2SinceWeek'].mode()[0]
        store['Promo2SinceWeek'].fillna(mode_promo2_since_week, inplace=True)

        mode_promo2_since_year = store['Promo2SinceYear'].mode()[0]
        store['Promo2SinceYear'].fillna(mode_promo2_since_year, inplace=True)

        store['PromoInterval'].fillna('None', inplace=True)

        # With the assumption the stores are open if there is no explicit
        # indication that they are closed.
        test['Open'].fillna(1, inplace=True)

        # Data preprocessing steps
        train['Date'] = pd.to_datetime(train['Date'])
        test['Date'] = pd.to_datetime(test['Date'])

        self.extract_date_features(train)
        self.extract_date_features(test)

        # Merge store information
        train = train.merge(store, on='Store', how='left')
        test = test.merge(store, on='Store', how='left')

        train.fillna(0, inplace=True)
        test.fillna(0, inplace=True)

        train.to_csv(self.output_train_path, index=False)
        test.to_csv(self.output_test_path, index=False)

    def extract_date_features(self, df):
        df['Year'] = df['Date'].dt.year
        df['Month'] = df['Date'].dt.month
        df['Day'] = df['Date'].dt.day
        df['DayOfWeek'] = df['Date'].dt.dayofweek
        df['IsWeekend'] = df['DayOfWeek'] >= 5
        df['WeekOfYear'] = df['Date'].dt.isocalendar().week
        df['Quarter'] = df['Date'].dt.quarter
        df['IsMonthStart'] = df['Date'].dt.is_month_start
        df['IsMonthEnd'] = df['Date'].dt.is_month_end
        df['IsQuarterStart'] = df['Date'].dt.is_quarter_start
        df['IsQuarterEnd'] = df['Date'].dt.is_quarter_end

        # Extract holiday dates
        holiday_dates = df[df['StateHoliday'] != '0']['Date'].sort_values(
        ).unique()

        # Convert the array to a pandas Series for vectorized operations
        holiday_series = pd.Series(holiday_dates)

        # Initialize arrays for results
        days_to_holiday = np.full(len(df), np.nan)
        days_after_holiday = np.full(len(df), np.nan)

        # Use searchsorted to find the indices of the next and
        # previous holidays
        idx_next_holiday = np.searchsorted(
            holiday_series, df['Date'], side='left')
        idx_prev_holiday = np.searchsorted(
            holiday_series, df['Date'], side='right') - 1

        # Calculate days to the next holiday
        valid_next_holiday = idx_next_holiday < len(holiday_series)
        days_to_holiday[valid_next_holiday] = (
            holiday_series.iloc[idx_next_holiday[valid_next_holiday]].values -
            df['Date'][valid_next_holiday].values) / np.timedelta64(1, 'D')

        # Calculate days after the last holiday
        valid_prev_holiday = idx_prev_holiday >= 0
        days_after_holiday[valid_prev_holiday] = (
            df['Date'][
                valid_prev_holiday].values - holiday_series.iloc[
                    idx_prev_holiday[valid_prev_holiday]
                ].values) / np.timedelta64(1, 'D')

        # Assign results back to the DataFrame
        df['DaysToHoliday'] = days_to_holiday
        df['DaysAfterHoliday'] = days_after_holiday

        return df
