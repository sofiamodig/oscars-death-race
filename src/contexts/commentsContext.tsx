import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { useSnackbarContext } from "./snackbarContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabase";

type Comment = { comment: string; imdbId: string };
type CommentsContextType = {
  comments: Comment[];
  addComment: (comment: Comment) => void;
  updateComment: (comment: Comment) => void;
  deleteComment: (id: string) => void;
};

export const CommentsContext = createContext<CommentsContextType>({
  comments: [],
  addComment: () => {},
  updateComment: () => {},
  deleteComment: () => {},
});
export const useCommentsContext = () => useContext(CommentsContext);

export const CommentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const { showSnackbar } = useSnackbarContext();

  useEffect(() => {
    let active = true;
    if (!userId) {
      setComments([]);
      return;
    }
    setComments([]);
    supabase
      .from("user_comments")
      .select("imdb_id, comment")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          showSnackbar(`Failed to fetch comments: ${error.message}`, "error");
          return;
        }
        setComments((data ?? []).map((row) => ({ imdbId: row.imdb_id, comment: row.comment })));
      });
    return () => { active = false; };
  }, [showSnackbar, userId]);

  const saveComment = async (comment: Comment) => {
    if (!userId) return;
    const { error } = await supabase.from("user_comments").upsert(
      { user_id: userId, imdb_id: comment.imdbId, comment: comment.comment },
      { onConflict: "user_id,imdb_id" }
    );
    if (error) {
      showSnackbar(`Failed to save comment: ${error.message}`, "error");
      return;
    }
    setComments((previous) => [
      ...previous.filter((item) => item.imdbId !== comment.imdbId),
      comment,
    ]);
  };

  const deleteComment = async (imdbId: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("user_comments")
      .delete()
      .eq("user_id", userId)
      .eq("imdb_id", imdbId);
    if (error) {
      showSnackbar(`Failed to delete comment: ${error.message}`, "error");
      return;
    }
    setComments((previous) => previous.filter((item) => item.imdbId !== imdbId));
  };

  return (
    <CommentsContext.Provider
      value={{ comments, addComment: saveComment, updateComment: saveComment, deleteComment }}
    >
      {children}
    </CommentsContext.Provider>
  );
};
