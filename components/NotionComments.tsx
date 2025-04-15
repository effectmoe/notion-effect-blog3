import React, { useState, useEffect } from 'react';
import cs from 'classnames';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import styles from './NotionComments.module.css';

// コメントの型定義
type Comment = {
  id: string;
  created_time: string;
  rich_text: {
    plain_text: string;
  }[];
  user?: {
    name: string;
    avatar_url?: string;
  }
};

type NotionCommentsProps = {
  pageId: string;
  className?: string;
};

export const NotionComments: React.FC<NotionCommentsProps> = ({ pageId, className }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // コメントを取得する
  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notion-comments?blockId=${pageId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('コメントの取得に失敗しました。後でもう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // コメントを追加する
  const addComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notion-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          content: newComment,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      // コメント投稿成功
      setNewComment('');
      fetchComments(); // コメントを再取得
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('コメントの投稿に失敗しました。後でもう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // マウント時にコメントを取得
  useEffect(() => {
    if (pageId) {
      fetchComments();
    }
  }, [pageId]);

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: ja });
    } catch (err) {
      return dateString;
    }
  };

  return (
    <div className={cs(styles.commentsContainer, className)}>
      <h3 className={styles.commentsTitle}>コメント</h3>
      
      {/* エラーメッセージ */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {/* コメント投稿フォーム */}
      <div className={styles.commentForm}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="コメントを入力..."
          className={styles.commentInput}
          disabled={isSubmitting}
        />
        <button
          onClick={addComment}
          disabled={isSubmitting || !newComment.trim()}
          className={styles.commentButton}
        >
          {isSubmitting ? '送信中...' : '送信'}
        </button>
      </div>
      
      {/* コメント一覧 */}
      <div className={styles.commentsList}>
        {isLoading ? (
          <div className={styles.loadingMessage}>コメントを読み込み中...</div>
        ) : comments.length === 0 ? (
          <div className={styles.emptyMessage}>まだコメントはありません。</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <div className={styles.commentUser}>
                  {comment.user?.avatar_url && (
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.name || 'ユーザー'}
                      className={styles.userAvatar}
                    />
                  )}
                  <span className={styles.userName}>{comment.user?.name || '匿名'}</span>
                </div>
                <span className={styles.commentDate}>
                  {formatDate(comment.created_time)}
                </span>
              </div>
              <div className={styles.commentContent}>
                {comment.rich_text?.map((text, index) => (
                  <p key={index}>{text.plain_text}</p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* もっと見るボタン（将来的にページネーション対応） */}
      {comments.length > 0 && (
        <button
          onClick={fetchComments}
          className={styles.loadMoreButton}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : 'コメントを更新'}
        </button>
      )}
    </div>
  );
};

export default NotionComments;
