const bcrypt = require('bcrypt');
const express = require('express');
const movieSeries = require('../models/movieSeries');
const Comment = require('../models/Comment');

//Create Comment
exports.CreateComment = async (req, res) => {
  try {
    const { comment, user, rating } = req.body;

    // Kullanıcıdan gelen yıldız değerini kontrol etmek
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'fail',
        error: 'Star value must be between 1 and 5.',
      });
    }

    const createComment = await Comment.create({
      comment: comment,
      createdBy: user,
      rating:rating,
    });

    const movieseries = await movieSeries.findOne({ _id: req.params.id }); 
    if (!movieseries) {
      return res.status(404).json({
        status: 'fail',
        error: 'Film series not found.',
      });
    }

    // Mevcut yorumları alıp yeni yorumun ObjectId'sini eklemek
    if (Array.isArray(movieseries.comments)) {
      //Dizi olup olmadığını kontrol eder
      movieseries.comments.push(createComment._id); //Dizi ise dizinin sonuna ekler
    } else {
      //bir dizi değilse (yani daha önce hiç yorum eklenmemişse)
      movieseries.comments = [createComment._id];
    }

    await movieseries.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      createComment,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error: error.message,
    });
  }
};

// Delete Comment
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId; // Silinecek yorumun ID'sini al

    // Yorumu veritabanından bul
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: 'fail',
        error: 'Comment not found.',
      });
    }

    // Yorumu veritabanından sil
    await Comment.findByIdAndDelete(commentId);

    // Yorumun bağlı olduğu film serisinden kaldır
    const movieseries = await movieSeries.findOne({ comments: commentId });
    if (movieseries) {
      movieseries.comments.pull(commentId);
      await movieseries.save();
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error: error.message,
    });
  }
};

// Update Comment
exports.updateComment = async (req, res) => {
  try {
    const commentId = req.params.commentId; // Güncellenecek yorumun ID'sini al
    const updatedCommentData = req.body; // Yeni yorum verilerini al

    // Yorumu veritabanından bul
    const comment = await Comment.findByIdAndUpdate(commentId, updatedCommentData, {
      new: true, // Güncellenmiş yorumu döndür
    });

    if (!comment) {
      return res.status(404).json({
        status: 'fail',
        error: 'Comment not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      data: comment, // Güncellenmiş yorum verilerini yanıt olarak dön
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error: error.message,
    });
  }
};

//Get Comment
exports.getComment = async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id });
    res.status(200).json({
      success: true,
      comment,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error: error.message,
    });
  }
};

//All Comment (Filme gelen yorumların ID'lerini buluyor)
exports.getAllComments = async (req, res) => {
  try {
    const movieId = req.params.id;//hangi film veya dizi için yorumları çekeceğimizi belirler
    const movie = await movieSeries.findById(movieId).populate({
      path: 'comments',
      options: { sort: { createdDate: -1 } }, // Yorumları yaratılma tarihine göre sırala
    });
        
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Film veya dizi bulunamadı.',
      });
    }

    res.status(200).json({
      success: true,
      comments: movie.comments,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error: error.message,
    });
  }
};


exports.calculateAverageRating = async (req,res,filmId) => {
  try {
    const comments = await Comment.find({ film: filmId });

    if (comments.length === 0) {
      return 0; // Yorum yoksa ortalama 0 olur
    }

    const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
    const averageRating = totalRating / comments.length;

    return averageRating;
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Like işlemi
exports.Like = async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id });
    const userId = req.body.userId;

    // Kullanıcının daha önce bu filme like yapmadığını kontrol et
    const user = await User.findById(userId);
    if (!user.likedMovies.includes(comment.movieId)) {
      // Like işlemini gerçekleştir
      await comment.updateOne({ $push: { likes: userId } });

      // Kullanıcının "likedMovies" listesine bu filmi ekleyin
      await User.updateOne({ _id: userId }, { $push: { likedMovies: comment.movieId } });

      res.status(200).json("The post has been liked");
    } else {
      res.status(400).json("You have already liked this post.");
    }
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      error: error.message,
    });
  }
};

// Dislike işlemi
exports.Dislike = async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id });
    const userId = req.body.userId;

    // Kullanıcının daha önce bu filme dislike yapmadığını kontrol et
    const user = await User.findById(userId);
    if (!user.dislikedMovies.includes(comment.movieId)) {
      // Dislike işlemini gerçekleştir
      await comment.updateOne({ $push: { dislikes: userId } });

      // Kullanıcının "dislikedMovies" listesine bu filmi ekleyin
      await User.updateOne({ _id: userId }, { $push: { dislikedMovies: comment.movieId } });

      res.status(200).json("The post has been disliked");
    } else {
      res.status(400).json("You have already disliked this post.");
    }
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      error: error.message,
    });
  }
};
