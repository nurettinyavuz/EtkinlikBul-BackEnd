const bcrypt = require('bcrypt');
const express = require('express');
const User = require('../../models/User');
const movieSeries = require('../../models/movieSeries');
const Comment = require('../../models/Comment');

exports.createMovieSeries = async (req, res) => {
  try {
    const movieseries = await movieSeries.create(req.body);
    const user = req.user.userId;

    if (user.role !== 'admin') {
      return res.status(400).json({
        status: 'fail',
        error: 'Bu işlem için yetkiniz yok',
      });
    }

    res.status(201).json({
      status: 'success',
      movieseries,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error,
    });
  }
};

exports.updateMovieSeries = async (req, res) => {
  try {
    const movieSeriesId = req.params.id;
    const updateMovieSeriesData = req.body;
    const user = req.user.userId;

    if (user.role !== 'admin') {
      return res.status(400).json({
        status: 'fail',
        error: 'Bu işlem için yetkiniz yok',
      });
    }
    const movieseries = await movieSeries.findByIdAndUpdate(
      movieSeriesId,
      updateMovieSeriesData,
      {
        new: true,
      }
    );
    if (!movieSeries) {
      res.status(400).json({
        status: 'fail',
        error: 'No movieSeries found',
      });
    }
    res.status(201).json({
      status: 'success',
      movieseries,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error: error.message,
    });
  }
};

exports.getAllMovies = async (req, res) => {
  try {
    const movies = await movieSeries.find({ MovieOrSeries: 'Film' });
    if (!movies) {
      res.status(400).json({
        status: 'fail',
        error: 'No movies found',
      });
    }
    res.status(201).json({
      status: 'success',
      movies,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error,
    });
  }
};

exports.getAllSeries = async (req, res) => {
  try {
    const series = await movieSeries.find({ MovieOrSeries: 'Dizi' });
    if (!series) {
      res.status(400).json({
        status: 'fail',
        error: 'No series found',
      });
    }
    res.status(201).json({
      status: 'success',
      series,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error,
    });
  }
};
