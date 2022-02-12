/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useState } from 'react';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: any;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [postsList, setPostsList] = useState<PostPagination>(postsPagination);
  function getNextPage() {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(data => {
        const posts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
        const postsPaginationList = {
          next_page: data.next_page,
          results: [...postsList.results, ...posts],
        };
        setPostsList(postsPaginationList);
      });
  }
  return (
    <div className={commonStyles.container}>
      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
      {postsList?.results.map(post => {
        return (
          <section key={post.data.subtitle} className={styles.post}>
            <div className={styles.header}>
              <Link href={`/post/${post.uid}`}>
                <h1>{post.data.title}</h1>
              </Link>
              <h2>{post.data.subtitle}</h2>
            </div>
            <div className={styles.subHeader}>
              <p>
                <FiCalendar />

                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </p>
              <p>
                <FiUser />
                {post.data.author}
              </p>
            </div>
          </section>
        );
      })}
      {postsList.next_page && (
        <button
          type="button"
          className={styles.morePosts}
          onClick={getNextPage}
        >
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };
  return {
    props: { postsPagination, preview },
  };
};
