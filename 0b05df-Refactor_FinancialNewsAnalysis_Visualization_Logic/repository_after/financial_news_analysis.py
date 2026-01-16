#!/usr/bin/python3
"""
This module provides a class, FinancialNewsAnalysis, for performing
descriptive statistics analysis on financial news data.
"""
import pandas as pd
import matplotlib.pyplot as plt


class FinancialNewsAnalysis:
    """
    A class for analyzing financial news data.

    Parameters:
    - data_path (str): The path to the CSV file containing the financial
      news data.
    """
    def __init__(self, data_path):
        """
        Initialize the FinancialNewsAnalysis object.

        Args:
        - data_path (str): The path to the CSV file containing the financial
          news data.
        """
        self.data = pd.read_csv(data_path)

    def descriptive_statistics(self):
        """
        Perform descriptive statistics analysis on the financial news data.

        Returns:
        - headline_stats (pandas Series): Basic statistics for headline lengths
        - publisher_counts (pandas Series): Number of articles per publisher
        - date_counts (pandas Series): Number of articles published on each date
        """
        self.data['headline_length'] = self.data['headline'].apply(len)

        headline_stats = self.data['headline_length'].describe()
        publisher_counts = self.data['publisher'].value_counts()

        self.data['date'] = pd.to_datetime(self.data['date'], errors='coerce')
        date_counts = self.data['date'].dt.date.value_counts()

        return headline_stats, publisher_counts, date_counts

    def _create_figure(self, figsize):
        """
        Create a new figure and axis with the specified size.

        Args:
        - figsize (tuple): Width and height of the figure in inches.

        Returns:
        - fig: The matplotlib figure object.
        - ax: The matplotlib axis object.
        """
        fig, ax = plt.subplots(figsize=figsize)
        return fig, ax

    def _configure_axis(self, ax, xlabel, ylabel, title, grid_axis=None,
                        xticks_rotation=None, xticks_ha=None):
        """
        Configure axis labels, title, grid, and tick rotation.

        Args:
        - ax: The matplotlib axis object.
        - xlabel (str): Label for the x-axis.
        - ylabel (str): Label for the y-axis.
        - title (str): Title of the plot.
        - grid_axis (str, optional): Axis for grid ('x', 'y', or 'both').
        - xticks_rotation (float, optional): Rotation angle for x-tick labels.
        - xticks_ha (str, optional): Horizontal alignment for x-tick labels.
        """
        ax.set_xlabel(xlabel)
        ax.set_ylabel(ylabel)
        ax.set_title(title)
        if grid_axis is not None:
            ax.grid(axis=grid_axis, alpha=0.75)
        if xticks_rotation is not None:
            if xticks_ha is not None:
                plt.setp(ax.get_xticklabels(), rotation=xticks_rotation, ha=xticks_ha)
            else:
                plt.setp(ax.get_xticklabels(), rotation=xticks_rotation)

    def _show_plot(self):
        """
        Display the current plot.
        """
        plt.show()

    def _plot_histogram(self, data, bins, xlabel, ylabel, title,
                        figsize, grid_axis='y', xticks_rotation=None):
        """
        Create and display a histogram plot.

        Args:
        - data: The data to plot.
        - bins (int): Number of bins for the histogram.
        - xlabel (str): Label for the x-axis.
        - ylabel (str): Label for the y-axis.
        - title (str): Title of the plot.
        - figsize (tuple): Width and height of the figure in inches.
        - grid_axis (str, optional): Axis for grid. Defaults to 'y'.
        - xticks_rotation (float, optional): Rotation angle for x-tick labels.
        """
        fig, ax = self._create_figure(figsize)
        ax.hist(data, bins=bins, color='skyblue', edgecolor='black')
        self._configure_axis(ax, xlabel, ylabel, title,
                             grid_axis=grid_axis, xticks_rotation=xticks_rotation)
        self._show_plot()

    def _plot_bar(self, series, xlabel, ylabel, title, figsize,
                  xticks_rotation=45, xticks_ha='right'):
        """
        Create and display a bar plot.

        Args:
        - series: A pandas Series to plot.
        - xlabel (str): Label for the x-axis.
        - ylabel (str): Label for the y-axis.
        - title (str): Title of the plot.
        - figsize (tuple): Width and height of the figure in inches.
        - xticks_rotation (float, optional): Rotation angle for x-tick labels.
        - xticks_ha (str, optional): Horizontal alignment for x-tick labels.
        """
        fig, ax = self._create_figure(figsize)
        series.plot(kind='bar', color='skyblue', edgecolor='black', ax=ax)
        self._configure_axis(ax, xlabel, ylabel, title,
                             xticks_rotation=xticks_rotation, xticks_ha=xticks_ha)
        self._show_plot()

    def visualize_stat_measures(self):
        """
        Visualize descriptive statistics measures.

        This method generates visualizations for:
        - Distribution of headline lengths
        - Top 10 publishers by article count
        - Publication date distribution
        """
        self._plot_histogram(
            data=self.data['headline_length'],
            bins=30,
            xlabel='Headline Length',
            ylabel='Frequency',
            title='Distribution of Headline Lengths',
            figsize=(12, 6)
        )

        top_publishers = self.data['publisher'].value_counts().head(10)
        self._plot_bar(
            series=top_publishers,
            xlabel='Publisher',
            ylabel='Number of Articles',
            title='Top 10 Publishers by Article Count',
            figsize=(14, 6)
        )

        self._plot_histogram(
            data=self.data['date'].dropna(),
            bins=50,
            xlabel='Publication Date',
            ylabel='Frequency',
            title='Publication Date Distribution',
            figsize=(12, 6),
            xticks_rotation=45
        )
